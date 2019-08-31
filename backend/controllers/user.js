const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const client = require('../connection.js')


exports.createUser = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: hash
    };
    client.index({
      index: 'user',
      refresh: true,
      body: user
    })
      .then(result => {
        console.dir(result);
        res.status(201).json({
          message: "User created!",
          result: result
        });
      })
      .catch(err => {
        res.status(500).json({
          message: "Unable to create new user!"
        });
      });
  });
}


exports.userLogin = (req, res, next) => {
  let fetchedUser;

  client.search({
    index: 'user',
    body: {
      "query" : {
        "match":{
          "email": req.body.email
        }
      }
    }
  })
    .then(user => {
      if (!user.body.hits.hits[0]) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      fetchedUser = user.body.hits.hits[0]._source;
      user_id = user.body.hits.hits[0]._id;
      return bcrypt.compare(req.body.password, fetchedUser.password);
    })
    .then(result => {
      if (!result) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      const token = jwt.sign(
        { email: fetchedUser.email, userId: user_id },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
      res.status(200).json({
        token: token,
        expiresIn: 3600,
        userId: user_id
      });
    })
    .catch(err => {
      return res.status(401).json({
        message: "Invalid authentication credentials!"
      });
    });
}
