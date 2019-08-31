import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { Post } from './post.model';

const BACKEND_URL = environment.apiUrl + '/posts/';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private posts: Post[] = [];
  private users: [];
  private topics: [];
  private postsUpdated = new Subject<{ posts: Post[]; postCount: number }>();
  private usersUpdated = new Subject<{ users: []}>();
  private topicsUpdated = new Subject<{ topics: []}>();

  constructor(private http: HttpClient, private router: Router) {}

  getAllUsersHavingPosts() {
    this.http.get<[]>(BACKEND_URL + 'getAllUsersHavingPosts')
    .subscribe(users => {
      this.users = users;
      this.usersUpdated.next({
        users: users
      });
    });
  }

  getTopics() {
    this.http.get<[]>(BACKEND_URL + 'getTopics')
    .subscribe(topics => {
      this.topics = topics;
      this.topicsUpdated.next({
        topics: topics
      });
    });
  }

  getPosts(postsPerPage: number, currentPage: number, filterBy: object) {
    const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}&filterBy=${JSON.stringify(filterBy)}`;
    this.http
      .get<{ message: string; posts: any; maxPosts: number }>(
        BACKEND_URL + queryParams
      )
      .pipe(
        map(postData => {
          console.log(postData);
          return {
            posts: postData.posts.map(post => {
              return {
                title: post._source.title,
                topic: post._source.topic,
                content: post._source.content,
                id: post._id,
                creator: post._source.creator
              };
            }),
            maxPosts: postData.maxPosts
          };
        })
      )
      .subscribe(transformedPostData => {
        this.posts = transformedPostData.posts;
        this.postsUpdated.next({
          posts: [...this.posts],
          postCount: transformedPostData.maxPosts
        });
      });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getUserUpdateListener() {
    return this.usersUpdated.asObservable();
  }

  getTopicUpdateListener() {
    return this.topicsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.http.get<Post>(BACKEND_URL + id);
  }

  addPost(title: string, topic: string, content: string) {
    const postData = new FormData();
    postData.append('title', title);
    postData.append('topic', topic);
    postData.append('content', content);
    this.http
      .post<{ message: string; post: Post }>(
        BACKEND_URL,
        postData
      )
      .subscribe(responseData => {
        this.router.navigate(['/']);
      });
  }

  updatePost(id: string, title: string, topic: string, content: string) {
    let postData: Post | FormData;
    postData = {
      id: id,
      title: title,
      topic: topic,
      content: content,
      creator: null
    };
    this.http
      .put(BACKEND_URL + id, postData)
      .subscribe(response => {
        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    return this.http.delete(BACKEND_URL + postId);
  }
}
