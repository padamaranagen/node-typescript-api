# Node Typescript API

In a terminal (or command prompt), we’ll create a folder for the project. From that folder, run npm init. That will create some of the basic Node.js project files we need.

Next, we’ll add the Express.js framework and some helpful libraries:

```javascript
npm install --save express debug winston express-winston cors
```

There are good reasons these libraries are Node.js developer favorite

* debug is a module that we will use to avoid calling console.log() while developing our application. This way, we can easily filter debug statements during troubleshooting. They can also be switched off entirely in production instead of having to be removed manually.
  
*  winstonis responsible for logging requests to our API and the responses (and errors) returned. express-winston integrates directly with Express.js, so that all standard API-related winston logging code is already done.
* cors is a piece of Express.js middleware that allows us to enable cross-origin resource sharing. Without this, our API would only be usable from front ends being served from the exact same subdomain as our back end.

Our back end uses these packages when it’s running. But we also need to install some development dependencies for our TypeScript configuration. For that, we’ll run:

```javascript
npm install --save-dev @types/cors @types/express @types/debug source-map-support tslint typescript
```

These dependencies are required to enable TypeScript for our app’s own code, along with the types used by Express.js and other dependencies. This can save a lot of time when we’re using an IDE like WebStorm or VSCode by allowing us to complete some function methods automatically while coding.


The final dependencies in package.json should be like this:

```json
"dependencies": {
    "cors": "^2.8.5",
    "debug": "^4.3.1",
    "express": "^4.17.1",
    "express-winston": "^4.1.0",
    "winston": "^3.3.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.10",
    "@types/debug": "^4.1.5",
    "@types/express": "^4.17.11",
    "source-map-support": "^0.5.19",
    "tslint": "^6.1.3",
    "typescript": "^4.2.2"
  }    
```
Now that we have all our required dependencies installed, let’s start to build up our own code!

### TypeScript REST API Project Structure

For this tutorial, we are going to create just three files:

  1.  ``` ./app.ts   ```
1. ```./common/common.routes.config.ts```
2. ```./users/users.routes.config.ts```

The idea behind the project structure’s two folders (**common** and **users**) is to have individual modules that have their own responsibilities. In this sense, we are eventually going to have some or all of the following for each module:

* **Route** configuration to define the requests our API can handle
* **Services** for tasks such as connecting to our database models, doing queries, or connecting to external services that are required by the specific request
* **Middleware** for running specific request validations before the final controller of a route handles its specifics
* **Models** for defining data models matching a given database schema, to facilitate data storage and retrieval
* **Controllers** for separating the route configuration from the code that finally (after any middleware) processes a route request, calls the above service functions if necessary, and gives a response to the client

This folder structure provides an early starting point for the rest of this tutorial series and enough to start practicing.

## A Common Routes File in TypeScript

In the common folder, let’s create the ```common.routes.config.ts``` file to look like the following:

```typescript
import express from 'express';
export class CommonRoutesConfig {
    app: express.Application;
    name: string;

    constructor(app: express.Application, name: string) {
        this.app = app;
        this.name = name;
    }
    getName() {
        return this.name;
    }
}
```

The way that we are creating the routes here is optional. But since we are working with TypeScript, our routes scenario is an opportunity to practice using inheritance with the **extends** keyword, as we’ll see shortly. In this project, all route files have the same behavior: They have a name (which we will use for debugging purposes) and access to the main **Express.js** Application object.

Now, we can start to create the users route file. At the users folder, let’s create ```users.routes.config.ts``` and start to code it like this:

```typescript
import {CommonRoutesConfig} from '../common/common.routes.config';
import express from 'express';

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'UsersRoutes');
    }
}
```

Here, we are importing the **CommonRoutesConfig** class and extending it to our new class, called **UsersRoutes**. With the constructor, we send the app (the main **express.Application** object) and the name UsersRoutes to **CommonRoutesConfig’s** constructor.

This example is quite simple, but when scaling to create several route files, this will help us avoid duplicate code.

Suppose we would want to add new features in this file, such as logging. We could add the necessary field to the **CommonRoutesConfig** class, and then all the routes that extend **CommonRoutesConfig** will have access to it.


## Using TypeScript Abstract Functions for Similar Functionality Across Classes


What if we would like to have some functionality that is similar between these classes (like configuring the API endpoints), but that needs a different implementation for each class? One option is to use a TypeScript feature called **abstraction**.


Let’s create a very simple abstract function that the **UsersRoutes** class (and future routing classes) will inherit from **CommonRoutesConfig**. Let’s say that we want to force all routes to have a function (so we can call it from our common constructor) named **configureRoutes()**. That’s where we’ll declare the endpoints of each routing class’ resource.


To do this, we’ll add three quick things to **common.routes.config.ts**:

1. The keyword **abstract** to our **class** line, to enable abstraction for this class.
2. A new function declaration at the end of our class, abstract configureRoutes(): express.Application;. This forces any class extending CommonRoutesConfig to provide an implementation matching that signature—if it doesn’t, the TypeScript compiler will throw an error.
3. A call to this.configureRoutes(); at the end of the constructor, since we can now be sure that this function will exist.

The result:

```typescript
import express from 'express';
export abstract class CommonRoutesConfig {
    app: express.Application;
    name: string;

    constructor(app: express.Application, name: string) {
        this.app = app;
        this.name = name;
        this.configureRoutes();
    }
    getName() {
        return this.name;
    }
    abstract configureRoutes(): express.Application;
}
```

With that, any class extending CommonRoutesConfig must have a function called configureRoutes() that returns an express.Application object. That means users.routes.config.ts needs updating:

```typescript
import {CommonRoutesConfig} from '../common/common.routes.config';
import express from 'express';

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'UsersRoutes');
    }

    configureRoutes() {
        // (we'll add the actual route configuration here next)
        return this.app;
    }

}
```

We are first importing the ```common.routes.config``` file, then the **express** module. We then define the **UserRoutes** class, saying that we want it to extend the CommonRoutesConfig base class, which implies that we promise that it will implement **configureRoutes()**.

To send information along to the CommonRoutesConfig class, we are using the constructor of the class. It expects to receive the express.Application object, which we will describe in greater depth in the next step. With super(), we pass to CommonRoutesConfig’s constructor the application and the name of our routes, which in this scenario is UsersRoutes. (super(), in turn, will call our implementation of configureRoutes().)

## Configuring the Express.js Routes of the Users Endpoints

The configureRoutes() function is where we will create the endpoints for users of our REST API. There, we will use the application and its route functionalities from Express.js.

The idea in using the app.route() function is to avoid code duplication, which is easy since we’re creating a REST API with well-defined resources. The main resource for this tutorial is users. We have two cases in this scenario:

* When the API caller wants to create a new user or list all existing users, the endpoint should initially just have users at the end of the requested path. (We won’t be getting into query filtering, pagination, or other such queries in this article.)
* When the caller wants to do something specific to a specific user record, the request’s resource path will follow the pattern users/:userId.

The way .route() works in Express.js lets us handle HTTP verbs with some elegant chaining. This is because .get(), .post(), etc., all return the same instance of the IRoute that the first .route() call does. The final configuration will be like this:

```typescript
import {CommonRoutesConfig} from '../common/common.routes.config';
import express from 'express';

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'UsersRoutes');
    }

    configureRoutes() {
        this.app.route(`/users`)
        .get((req: express.Request, res: express.Response) => {
            res.status(200).send(`List of users`);
        })
        .post((req: express.Request, res: express.Response) => {
            res.status(200).send(`Post to users`);
        });

    this.app.route(`/users/:userId`)
        .all((req: express.Request, res: express.Response, next: express.NextFunction) => {
            // this middleware function runs before any request to /users/:userId
            // but it doesn't accomplish anything just yet---
            // it simply passes control to the next applicable function below using next()
            next();
        })
        .get((req: express.Request, res: express.Response) => {
            res.status(200).send(`GET requested for id ${req.params.userId}`);
        })
        .put((req: express.Request, res: express.Response) => {
            res.status(200).send(`PUT requested for id ${req.params.userId}`);
        })
        .patch((req: express.Request, res: express.Response) => {
            res.status(200).send(`PATCH requested for id ${req.params.userId}`);
        })
        .delete((req: express.Request, res: express.Response) => {
            res.status(200).send(`DELETE requested for id ${req.params.userId}`);
        });

    return this.app;
    }

}
```


The above code lets any REST API client call our **users** endpoint with a **POST** or a **GET** request. Similarly, it lets a client call our /users/:userId endpoint with a **GET**, **PUT**, **PATCH**, or **DELETE** request.

But for /users/:userId, we’ve also added generic middleware using the all() function, which will be run before any of the ``` get(), put(), patch(), or delete() ```functions. This function will be beneficial when (later in the series) we create routes that are meant to be accessed only by authenticated users.

You might have noticed that in our .all() function—as with any piece of middleware—we have three types of fields: **Request**, **Response**, and **NextFunction**.

* The Request is the way Express.js represents the HTTP request to be handled. This type upgrades and extends the native Node.js request type.
* The Response is likewise how Express.js represents the HTTP response, again extending the native Node.js response type.
* No less important, the NextFunction serves as a callback function, allowing control to pass through any other middleware functions. Along the way, all middleware will share the same request and response objects before the controller finally sends a response back to the requester.

## Our Node.js Entry-point File, ```app.ts```

Now that we have configured some basic route skeletons, we will start configuring the application’s entry point. Let’s create the app.ts file at the root of our project folder and begin it with this code:

```typescript
import express from 'express';
import * as http from 'http';
import * as bodyparser from 'body-parser';

import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cors from 'cors';
import {CommonRoutesConfig} from './common/common.routes.config';
import {UsersRoutes} from './users/users.routes.config';
import debug from 'debug';
```

Only two of these imports are new at this point in the article:

* **http** is a Node.js-native module. It’s required to start our Express.js application.
* **body-parser** is middleware that comes with Express.js. It parses the request (in our case, as JSON) before control goes to our own request handlers.

```typescript
const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = 3000;
const routes: Array<CommonRoutesConfig> = [];
const debugLog: debug.IDebugger = debug('app');
```

The express() function returns the main Express.js application object that we will pass around throughout our code, starting with adding it to the http.Server object. (We will need to start the http.Server after configuring our express.Application.)

We’ll listen on port 3000—which TypeScript will automatically infer is a Number—instead of the standard ports 80 (HTTP) or 443 (HTTPS) because those would typically be used for an app’s front end.

The routes array will keep track of our routes files for debugging purposes, as we’ll see below.

Finally, debugLog will end up as a function similar to console.log, but better: It’s easier to fine-tune because it’s automatically scoped to whatever we want to call our file/module context. (In this case, we’ve called it “app” when we passed that in a string to the debug() constructor.)

Now, we’re ready to configure all our Express.js middleware modules and the routes of our API:

```typescript
// here we are adding middleware to parse all incoming requests as JSON 
app.use(bodyparser.json());

// here we are adding middleware to allow cross-origin requests
app.use(cors());

// here we are configuring the expressWinston logging middleware,
// which will automatically log all HTTP requests handled by Express.js
app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
    )
}));

// here we are adding the UserRoutes to our array,
// after sending the Express.js application object to have the routes added to our app!
routes.push(new UsersRoutes(app));

// here we are configuring the expressWinston error-logging middleware,
// which doesn't *handle* errors per se, but does *log* them
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
    )
}));

// this is a simple route to make sure everything is working properly
app.get('/', (req: express.Request, res: express.Response) => {
    res.status(200).send(`Server up and running!`)
});
```

You might have noticed that the expressWinston.errorLogger is set after we define our routes

```
The logger needs to be added AFTER the express router (app.router) and BEFORE any of your custom error handlers (express.handler).
```

Finally and most importantly:


```typescript
server.listen(port, () => {
    debugLog(`Server running at http://localhost:${port}`);
    routes.forEach((route: CommonRoutesConfig) => {
        debugLog(`Routes configured for ${route.getName()}`);
    });
});
```

This actually starts our server. Once it’s started, Node.js will run our callback function, which reports that we’re running, followed by the names of all the routes we’ve configured—so far, just UsersRoutes.

## Updating ```package.json``` to Transpile TypeScript to JavaScript and Run the App

Now that we have our skeleton ready to run, we first need some boilerplate configuration to enable TypeScript transpilation. Let’s add the file tsconfig.json in the project root:

```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "inlineSourceMap": true
  }
}
```

Then we just need to add the final touches to ```package.json ``` in the form of the following scripts:


```json
"scripts": {
    "start": "tsc && node ./dist/app.js",
    "debug": "export DEBUG=* && npm run start",
    "test": "echo \"Error: no test specified\" && exit 1"
},
```
The test script is a placeholder that we’ll replace later in the series.

The tsc in the start script belongs to TypeScript. It’s responsible for transpiling our TypeScript code into JavaScript, which it will output into the dist folder. Then, we just run the built version with node ./dist/app.js.


The debug script calls the start script but first defines a DEBUG environment variable. This has the effect of enabling all of our debugLog() statements (plus similar ones from Express.js itself, which uses the same debug module we do) to output useful details to the terminal—details that are (conveniently) otherwise hidden when running the server in production mode with a standard npm start.

Try running npm run debug yourself, and afterward, compare that with npm start to see how the console output changes


```
Tip: You can limit the debug output to our app.ts file’s own debugLog() statements using DEBUG=app instead of DEBUG=*. The debug module is generally quite flexible, and this feature is no exception.
```


Windows users will probably need to change the export to SET since export is how it works on Mac and Linux. If your project needs to support multiple development environments, the cross-env package provides a straightforward solution here.

## Testing the Live Express.js Back End

With npm run debug or npm start still going, our REST API will be ready to service requests on port 3000. At this point, we can use cURL, Postman, Insomnia, etc. to test the back end.

Since we’ve only created a skeleton for the users resource, we can simply send requests without a body to see that everything is working as expected. For example:


```typescript
curl --request GET 'localhost:3000/users/12345'
```

Our back end should send back the answer GET requested for id 12345.

As for POSTing:
```typescript
curl --request POST 'localhost:3000/users' \
--data-raw ''
```
This and all other types of requests that we built skeletons for will look quite similar.

## Poised for Rapid Node.js REST API Development with TypeScript


In this article, we started to create a REST API by configuring the project from scratch and diving into the basics of the Express.js framework. Then, we took our first step toward mastering TypeScript by building a pattern with UsersRoutesConfig extending CommonRoutesConfig, a pattern that we will reuse for the next article in this series. We finished by configuring our app.ts entry point to use our new routes and package.json with scripts to build and run our application.


But even the basics of a REST API made with Express.js and TypeScript are fairly involved. In the next part of this series, we focus on creating proper controllers for the users resource and dig into some useful patterns for services, middleware, controllers, and models.


## REST API Services, Middleware, Controllers, and Models

As promised, we’ll now get into details about these modules:

* Services that make our code cleaner by encapsulating business logic operations into functions that middleware and controllers can call.
* Middleware that will validate prerequisite conditions before Express.js calls the appropriate controller function.
* Controllers that use services to process the request before finally sending a response to the requester.
* Models that describe our data and aid in compile-time checks.

We will also add a very rudimentary database that is in no way suitable for production. (Its only purpose is to make this tutorial easier to follow, paving the way for our next article to delve into database connection and integration with MongoDB and Mongoose.)


## Hands-on: First Steps with DAOs, DTOs, and Our Temporary Database

For this part of our tutorial, our database won’t even use files. It will simply keep user data in an array, which means the data evaporates whenever we quit Node.js. It will support only the most basic ```create, read, update, and delete``` (CRUD) operations.

We are going to use two concepts here:

* Data access objects (DAOs)
* Data transfer objects (DTOs)
