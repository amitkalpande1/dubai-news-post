import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material';
import { Subscription } from 'rxjs';

import { Post } from '../post.model';
import { PostsService } from '../posts.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  users: [];
  topics: [];
  isLoading = false;
  totalPosts = 100;
  postsPerPage = 20;
  currentPage = 1;
  pageSizeOptions = [2, 10, 20, 50, 100];
  userIsAuthenticated = false;
  userId: string;
  filterConf: {} = {
    creators: [],
    topics: [],
    searchQuery: ''
  };
  private postsSub: Subscription;
  private usersSub: Subscription;
  private topicsSub: Subscription;
  private authStatusSub: Subscription;

  constructor(
    public postsService: PostsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.postsService.getPosts(this.postsPerPage, this.currentPage, null);
    this.postsService.getAllUsersHavingPosts();
    this.postsService.getTopics();

    this.usersSub = this.postsService
    .getUserUpdateListener()
    .subscribe(usersData => {
      this.isLoading = false;
      this.users = usersData.users;
    });

    this.topicsSub = this.postsService
    .getTopicUpdateListener()
    .subscribe(topicsData => {
      this.isLoading = false;
      console.log(topicsData.topics);
      this.topics = topicsData.topics;
    });
    this.userId = this.authService.getUserId();
    this.postsSub = this.postsService
      .getPostUpdateListener()
      .subscribe((postData: { posts: Post[]; postCount: number }) => {
        this.isLoading = false;
        this.totalPosts = postData.postCount;
        this.posts = postData.posts;
      });
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      });
  }
  filterBy(key: string, value: string) {
    if (key !== 'searchQuery') {
      this.filterConf[key] = Array.isArray(value) ? value : [value];
    } else {
      this.filterConf[key] = value;
    }
    this.postsService.getPosts(this.postsPerPage, this.currentPage, this.filterConf);
  }

  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.postsPerPage = pageData.pageSize;
    this.postsService.getPosts(this.postsPerPage, this.currentPage, null);
  }

  onDelete(postId: string) {
    this.isLoading = true;
    this.postsService.deletePost(postId).subscribe(() => {
      this.postsService.getPosts(this.postsPerPage, this.currentPage, null);
    }, () => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.postsSub.unsubscribe();
    this.usersSub.unsubscribe();
    this.topicsSub.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
