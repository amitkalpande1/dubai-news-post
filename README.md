# Dubai News Post

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.1.


## Docker

To create the images and launch the containers -

`docker-compose up --build -d`

App should be running and you can access using `http:\\localhost`

## Rebuild docker incase code changes
In case of code changes on frontend, you need to run 
`ng build --prod` 
this will create distribution folder into backend\frontend folder

then run again 
`docker-compose up --build -d`

## Development server ( FrontEnd )

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


## Development server ( BackEnd )

Run `npm run start:server` for a dev server. apis will to be available `http://localhost:3000/api/`. The app will automatically reload if you change any of the source files.


## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
