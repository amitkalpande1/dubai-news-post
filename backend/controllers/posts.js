const client = require('../connection.js')

exports.createPost = (req, res, next) => {
  console.dir(req.body);
  const post = {
    title: req.body.title,
    topic: req.body.topic,
    content: req.body.content,
    creator: req.userData.userId
  };
  client.index({
    index: 'blog',
    refresh: true,
    body: post
  })
  .then(createdPost => {
    res.status(201).json({
      message: "Post added successfully",
      post: {
        ...createdPost,
        id: createdPost._id
      }
    });
  })
  .catch(error => {
    console.dir(error.body.error);
    res.status(500).json({
      message: "Creating a post failed!"
    });
  });
};

queryBuilder = (filerConf) => {
  const queryObj = [];
  if(filerConf) {
    const { creators, topics, searchQuery } = filerConf;
    if( creators.length > 0 ){
      creators.forEach(creator => {
        queryObj.push({
          "match": {
            "creator": creator
          }
        })
      });
    }
    if( topics.length > 0 ){
      topics.forEach(topic => {
        queryObj.push({
          "match": {
            "topic": topic
          }
        })
      });
    }
    if( searchQuery != ''){
      queryObj.push({
        "match": {
          "content": searchQuery
        }
      })
    }
  }
  return queryObj;
}


exports.getPosts = (req, res, next) => {
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  let filterBy = req.query.filterBy;
  if( filterBy !== null || filterBy !== 'null') {
    filterBy = JSON.parse(filterBy);
  }
  let fetchedPosts;
    client.search({
      index: 'blog',
      body: {
        "query": {
          "bool" : {
            "should": queryBuilder(filterBy)
          }
        }
      },
      "from" : pageSize * (currentPage - 1) || 0, "size" : pageSize
    })
    .then(documents => {
      fetchedPosts = documents.body.hits.hits;
      if(!Array.isArray(fetchedPosts)) {
        fetchedPosts = [fetchedPosts];
      }
      return fetchedPosts.length;
    })
    .then(count => {
      if(count === pageSize){
        count = (pageSize * currentPage) + 1;
      } else {
        count = (pageSize * ( currentPage - 1)) + count ;
      }
      res.status(200).json({
        message: "Posts fetched successfully!",
        posts: fetchedPosts,
        maxPosts: count
      });
    })
    .catch(error => {
      console.dir(error.body.error);
      if(error.body.error.type === 'index_not_found_exception') {
        res.status(200).json({
          message: "No post submited yet!",
          posts: [],
          maxPosts: 0
        });
      } else {
        res.status(500).json({
          message: "Fetching posts failed!"
        });
      }
    });
};

exports.getPost = (req, res, next) => {
    client.search({
      index: 'blog',
      body: {
        "query" : {
          "match":{
            "_id": req.params.id
          }
        }
      }
    })
    .then(post => {
      if (post.body.hits.hits) {
        res.status(200).json({
          id: post.body.hits.hits[0]._id,
          title: post.body.hits.hits[0]._source.title,
          topic: post.body.hits.hits[0]._source.topic,
          content: post.body.hits.hits[0]._source.content,
          creator: post.body.hits.hits[0]._source.creator
        });
      } else {
        res.status(404).json({ message: "Post not found!" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Fetching post failed!"
      });
    });
};

exports.updatePost = (req, res, next) => {
  var updateScript = {
    "source": "ctx._source.title = '" +
    req.body.title +"'; ctx._source.content = '" +
    req.body.content + "'; ctx._source.topic = '" +
    req.body.topic + "';"
  };
  client.updateByQuery({
    index: 'blog',
    refresh: true,
    body: {
      "query" : {
        "bool": {
          "must": [
              {"match": {"_id" : req.params.id }},
              {"match": {"creator" : req.userData.userId }},
          ]
        }
      },
      "script": updateScript
    }
  })
    .then(result => {
      if (result.body.updated > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(401).json({ message: "Unable udpate post!" });
      }
    })
    .catch(error => {
      console.dir(error.meta.body.error);
      res.status(500).json({
        message: "Couldn't udpate post!"
      });
    });
};

exports.deletePost = (req, res, next) => {
  client.deleteByQuery({
    index: 'blog',
    refresh: true,
    body: {
      "query" : {
        "bool": {
          "must": [
              {"match": {"_id" : req.params.id }},
              {"match": {"creator" : req.userData.userId }},
          ]
        }
      }
    }
  })
    .then(result => {
      if (result.body.deleted > 0) {
        res.status(200).json({ message: "Delete successful!" });
      } else {
        res.status(401).json({ message: "Unable Delete post!" });
      }
    })
    .catch(error => {
      console.dir(error.meta.body.error);
      res.status(500).json({
        message: "Couldn't Delete post!"
      });
    });
};

exports.getTopics = (req, res, next) => {
  let fetchedPostsTopics;
    client.search({
      index: 'blog',
      body: {
        "aggs": {
          "topics": {
            "terms": {
              "field": "topic.keyword"
            }
          }
        }
      }
    })
    .then(documents => {
      fetchedPostsTopics = documents.body.aggregations.topics.buckets;
      if(!Array.isArray(fetchedPostsTopics)) {
        fetchedPosts = [fetchedPostsTopics];
      }
      return fetchedPostsTopics.length;
    })
    .then(count => {
      res.status(200).json(fetchedPostsTopics);
    })
    .catch(error => {
      // console.dir(error.body.error);
      res.status(500).json({
        message: "Fetching topics failed!"
      });
    });
};


exports.getAllUsersHavingPosts = (req, res, next) => {
  let fetchedPostsCreatorsIds;
  let fetchedPostsCreators;
    client.search({
      index: 'blog',
      body: {
        "aggs": {
          "creators": {
            "terms": {
              "field": "creator.keyword"
            }
          }
        }
      }
    })
    .then(documents => {
      fetchedPostsCreatorsIds = documents.body.aggregations.creators.buckets;
      if(!Array.isArray(fetchedPostsCreatorsIds)) {
        fetchedPosts = [fetchedPostsCreatorsIds];
      }
      return fetchedPostsCreatorsIds;
    })
    .then(userIds => {
      let ids = [];
      userIds.forEach(function(element) {
        ids.push(element.key);
      });
      client.search({
        index: 'user',
        body: {
          "query": {
            "ids" : {
                "values" : ids
            }
          },
          "_source": [ "email", "name"]
        }
      })
      .then(documents => {
        res.status(200).json(documents.body.hits.hits);
      })
    })
    .catch(error => {
      console.dir(error.body.error);
      res.status(500).json({
        message: "Fetching Users with post failed!"
      });
    });
};
