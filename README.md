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

That one-letter difference between acronyms is essential: A DAO is responsible for connecting to a defined database and performing CRUD operations; a DTO is an object that holds the raw data that the DAO will send to—and receive from—the database.

In other words, DTOs are objects that conform to data model types, and DAOs are the services that use them.

While DTOs can get more complicated—representing nested database entities, for example—in this article, a single DTO instance will correspond to a single database row.

## Why DTOs?

Using DTOs to have our TypeScript objects conform to our data models helps maintain architectural consistency, as we’ll see in the section on services below. But there’s a crucial caveat: Neither DTOs nor TypeScript itself promise any sort of automatic user input validation, since that would have to occur at runtime. When our code receives user input at an endpoint in our API, that input may:

* Have extra fields
* Be missing required fields (i.e., those not suffixed with ?)
* Have fields in which the data is not the type we specified in our model using TypeScript

TypeScript (and the JavaScript it gets transpiled to) won’t magically check this for us, so it is important to not forget these validations, especially when opening your API to the public. Packages like ajv can help with this but normally work by defining models in a library-specific schema object rather than native TypeScript. (Mongoose, discussed in the next article, will play a similar role in this project.)


You might be thinking, “Is it really best to use both DAOs and DTOs, instead of something simpler?” Enterprise developer Gunther Popp offers an answer; you’ll want to avoid DTOs in most smaller real-world Express.js/TypeScript projects unless you can reasonably expect to scale in the medium term.

But even if you aren’t about to use them in production, this example project is a worthwhile opportunity on the road to mastering TypeScript API architecture. It’s a great way to practice leveraging TypeScript types in additional ways and working with DTOs to see how they compare to a more basic approach when adding components and models.

## Our User REST API Model at the TypeScript Level

First we will define a DTO for our user. Let’s create a folder called dto inside the users folder, and create a file there called user.dto.ts containing the following:

```typescript
export interface UserDto{
    id: string;
    name: string;
    password: string;
    firstname?: string; //optional
    lastname? : string; //optional
    permissionLevel? : string; //optional
}
```

We’re saying that every time we model a user, regardless of the database, it should have an ID, password, and email, and optionally a first and last name. These requirements can change based on the business requirements of a given project.

Now, let’s create the in-memory temporary database. Let’s create a folder called daos inside the users folder, and add a file named users.dao.ts.

First, we want to import the UserDto that we created:

```tyepscript
import {UserDto} from "../dto/user.dto";
```

Now, to handle our user IDs, let’s add the shortid library (using the terminal):

```typescript
npm i --save shortid
npm i --save-dev @types/shortid
```

Back in users.dao.ts, we’ll import shortid:

```typescript
class UsersDao {
    users: Array<UserDto> = [];

    constructor() {
        log('Created new instance of UsersDao');
    }
}
export default new UsersDao();
```

Using the singleton pattern, this class will always provide the same instance—and, critically, the same users array—when we import it in other files. That’s because Node.js caches this file wherever it’s imported, and all the imports happen on startup. That is, any file referring to users.dao.ts will be handed a reference to the same new UsersDao() that gets exported the first time Node.js processes this file.

We will see this working when we use this class further on in this article, and use this common TypeScript/Express.js pattern for most classes throughout the project.

```
Note: An oft-cited disadvantage to singletons is that they’re hard to write unit tests for. In the case of many of our classes, this disadvantage won’t apply, since there aren’t any class member variables that would need resetting. But for those where it would, we leave it as an exercise for the reader to consider approaching this problem with the use of dependency injection.
```

Now we are going to add the basic CRUD operations to the class as functions. The create function will look like this:

```typescript
async addUser(user: UserDto) {
    user.id = shortid.generate();
    this.users.push(user);
    return user.id;
}
```

Read will come in two flavors, “read all resources” and “read one by ID.” They’re coded like this:

```typescript
async getUsers() {
    return this.users;
}

async getUserById(userId: string) {
    return this.users.find((user: { id: string; }) => user.id === userId);
}
```

Likewise, update will mean either overwriting the complete object (as a PUT) or just parts of the object (as a PATCH):

```typescript
async putUserById(user: UserDto) {
    const objIndex = this.users.findIndex((obj: { id: string; }) => obj.id === user.id);
    this.users.splice(objIndex, 1, user);
    return `${user.id} updated via put`;
}

async patchUserById(user: UserDto) {
    const objIndex = this.users.findIndex((obj: { id: string; }) => obj.id === user.id);
    let currentUser = this.users[objIndex];
    const allowedPatchFields = ["password", "firstName", "lastName", "permissionLevel"];
    for (let field of allowedPatchFields) {
        if (field in user) {
            // @ts-ignore
            currentUser[field] = user[field];
        }
    }
    this.users.splice(objIndex, 1, currentUser);
    return `${user.id} patched`;
}
```

As mentioned earlier, despite our UserDto declaration in these function signatures, TypeScript provides no runtime type checking. This means that:

* putUserById() has a bug. It will let API consumers store values for fields that are not part of the model defined by our DTO.
* patchUserById() depends on a duplicate list of field names that must be kept in sync with the model. Without this, it would have to use the object being updated for this list. That would mean it would silently ignore values for fields that are part of the DTO-defined model but hadn’t been saved to before for this particular object instance.

But both these scenarios will be handled correctly at the database level in the next article.

The last operation, to delete a resource, will look like this:

```typescript
async removeUserById(userId: string) {
    const objIndex = this.users.findIndex((obj: { id: string; }) => obj.id === userId);
    this.users.splice(objIndex, 1);
    return `${userId} removed`;
}
```

As a bonus, knowing that a precondition to create a user is to validate if the user email is not duplicated, let’s add a “get user by email” function now:

```typescript
async getUserByEmail(email: string) {
    const objIndex = this.users.findIndex((obj: { email: string; }) => obj.email === email);
    let currentUser = this.users[objIndex];
    if (currentUser) {
        return currentUser;
    } else {
        return null;
    }
}
```

```
Note: In a real-world scenario, you will probably connect to a database using a preexisting library, such as Mongoose or Sequelize, which will abstract all the basic operations that you might need. Because of this, we are not going into the details of the functions implemented above.
```

## Our REST API Services Layer

Now that we have a basic, in-memory DAO, we can create a service that will call the CRUD functions. Since CRUD functions are something that every service that will connect to a database will need to have, we are going to create a CRUD interface that contains the methods we want to implement every time we want to implement a new service.

Nowadays, the IDEs that we work with have code generation features to add the functions we are implementing, reducing the amount of repetitive code we need to write.

That all said, let’s first create our TypeScript interface, called CRUD. At our common folder, let’s create a folder called interfaces and add crud.interface.ts with the following:

```typescript
export interface CRUD {
    list: (limit: number, page: number) => Promise<any>,
    create: (resource: any) => Promise<any>,
    updateById: (resourceId: any) => Promise<string>,
    readById: (resourceId: any) => Promise<any>,
    deleteById: (resourceId: any) => Promise<string>,
    patchById: (resourceId: any) => Promise<string>,
}
```

With that done, lets create a services folder within the users folder and add the users.service.ts file there, starting with:

```typescript
import UsersDao from '../dao/users.dao';
import {CRUD} from "../../common/interface/crud.interface";
import {UserDto} from "../dto/user.dto";

class UsersService implements CRUD{
    async create(resource: UserDto) {
        return UsersDao.addUser(resource);
    }

    async deleteById(resourceId: string) {
        return UsersDao.removeUserById(resourceId);
    };

    async list(limit: number, page: number) {
        return UsersDao.getUsers();
    };

    async patchById(resource: UserDto) {
        return UsersDao.patchUserById(resource)
    };

    async readById(resourceId: string) {
        return UsersDao.getUserById(resourceId);
    };

    async updateById(resource: UserDto) {
        return UsersDao.putUserById(resource);
    };

    async getUserByEmail(email: string) {
        return UsersDao.getUserByEmail(email);
    }
}

export default new UsersService();
```

Our first step is to import our in-memory DAO:

```typescript
import usersDao from '../daos/users.dao';
```

The name usersDao could be anything when we import it. But since we are already receiving an instance of the class, we’ll use the same name converted to camel case, as if it would be something like const usersDao = new UsersDao().

After importing our interface dependency and the TypeScript type of our DTO, it’s time to implement UsersService as a service singleton, the same pattern we used with our DAO.

All the CRUD functions now just call the usersDao and its own respective functions. When it comes time to replace the DAO, we won’t have to make changes anywhere else in the project, not even in this file where the DAO functions are called.

For example, we won’t have to track down every call to list() and check its context before replacing it. That’s the advantage of having this layer of separation, at the cost of the small amount of initial boilerplate you see above.

## Async/Await and Node.js


Our use of async for the service functions may seem pointless. For now, it is: All of these functions just immediately return their values, without any internal use of Promises or await. This is solely to prepare our codebase for services that will use async. Likewise, below, you’ll see that all calls to these functions use await.

By the end of this article, you’ll again have a runnable project to experiment with. That will be an excellent moment to try adding various types of errors in different places in the codebase, and seeing what happens during compilation and testing. Errors in an async context in particular may not behave quite as you’d expect. It’s worth digging in and exploring various solutions, which are beyond the scope of this article.

Now, having our DAO and services ready, let’s go back to the user controller.

## Building Our REST API Controller

As we said above, the idea behind controllers is to separate the route configuration from the code that finally processes a route request. That means that all validations should be done before our request reaches the controller. The controller only needs to know what to do with the actual request because if the request made it that far, then we know it turned out to be valid. The controller will then call the respective service of each request that it will be handling.

Before we start, we’ll need to install a library for securely hashing the user password:

```typescript
npm i --save argon2 
```

Let’s start by creating a folder called controllers inside the users controller folder and creating a file called users.controller.ts in it:

```typescript
// we import express to add types to the request/response objects from our controller functions
import express from 'express';

// we import our newly created user services
import usersService from '../services/users.service';

// we import the argon2 library for password hashing
import argon2 from 'argon2';

// we use debug with a custom context as described in Part 1
import debug from 'debug';

const log: debug.IDebugger = debug('app:users-controller');

class UsersController {

    async listUsers(req: express.Request, res: express.Response) {
        const users = await usersService.list(100, 0);
        res.status(200).send(users);
    }

    async getUserById(req: express.Request, res: express.Response) {
        const user = await usersService.readById(req.params.userId);
        res.status(200).send(user);
    }

    async createUser(req: express.Request, res: express.Response) {
        req.body.password = await argon2.hash(req.body.password);
        const userId = await usersService.create(req.body);
        res.status(201).send({id: userId});
    }

    async patch(req: express.Request, res: express.Response) {
        if(req.body.password){
            req.body.password = await argon2.hash(req.body.password);
        }
        log(await usersService.patchById(req.body));
        res.status(204).send(``);
    }

    async put(req: express.Request, res: express.Response) {
        req.body.password = await argon2.hash(req.body.password);
        log(await usersService.updateById({id: req.params.userId, ...req.body}));
        res.status(204).send(``);
    }

    async removeUser(req: express.Request, res: express.Response) {
        log(await usersService.deleteById(req.params.userId));
        res.status(204).send(``);
    }
}

export default new UsersController();
```

With our user controller singleton done, we’re ready to code the other module that depends on our example REST API object model and service: our user middleware.

## Node.js REST Middleware with Express.js

What can we do with Express.js middleware? Validations are a great fit, for one. Let’s add some basic validations to act as gatekeepers for requests before they make it to our user controller:

* Ensure the presence of user fields such as email and password as required to create or update a user
* Ensure a given email isn’t in use already
* Check that we’re not changing the email field after creation (since we’re using that as the primary user-facing ID for simplicity)
* Validate whether a given user exists

To make these validations to work with Express.js, we will need to translate them into functions that follow the Express.js pattern of flow control using next(), as described in the previous article. We’ll need a new file, users/middleware/users.middleware.ts:

```typescript
import express from 'express';
import userService from '../services/users.service';

class UsersMiddleware {
    async validateRequiredUserBodyFields(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (req.body && req.body.email && req.body.password) {
            next();
        } else {
            res.status(400).send({error: `Missing required fields: email and/or password`});
        }
    }
    
    async validateSameEmailDoesntExist(req: express.Request, res: express.Response, next: express.NextFunction) {
        const user = await userService.getUserByEmail(req.body.email);
        if (user) {
            res.status(400).send({error: `User email already exists`});
        } else {
            next();
        }
    }
    
    async validateSameEmailBelongToSameUser(req: express.Request, res: express.Response, next: express.NextFunction) {
        const user = await userService.getUserByEmail(req.body.email);
        if (user && user.id === req.params.userId) {
            next();
        } else {
            res.status(400).send({error: `Invalid email`});
        }
    }
    
    // Here we need to use an arrow function to bind `this` correctly
    validatePatchEmail = async(req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.body.email) {
            this.validateSameEmailBelongToSameUser(req, res, next);
        } else {
            next();
        }
    }
    
    async validateUserExists(req: express.Request, res: express.Response, next: express.NextFunction) {
        const user = await userService.readById(req.params.userId);
        if (user) {
            next();
        } else {
            res.status(404).send({error: `User ${req.params.userId} not found`});
        }
    }

    async extractUserId(req: express.Request, res: express.Response, next: express.NextFunction) {
        req.body.id = req.params.userId;
        next();
    }

}

export default new UsersMiddleware();
```

To make an easy way for our API consumers to make further requests about a newly added user, we are going to add a helper function that will extract the userId from the request parameters—coming in from the request URL itself—and add it to the request body, where the rest of the user data resides.


The idea here is to be able to simply use the full body request when we would like to update user information, without worrying about getting the ID from the parameters every time. Instead, it’s taken care of in just one spot, the middleware. The function will look like this:


```typescript
async extractUserId(req: express.Request, res: express.Response, next: express.NextFunction) {
        req.body.id = req.params.userId;
        next();
}
```

Besides the logic, the main difference between the middleware and the controller is that now we are using the next() function to pass control along a chain of configured functions until it arrives at the final destination, which in our case is the controller.


## Putting it All Together: Refactoring Our Routes

Now that we have implemented all the new aspects of our project architecture, let’s go back to the users.routes.config.ts file we defined in the previous article. It will call our middleware and our controllers, both of which rely on our user service, which in turn requires our user model.

The final file will be as simple as this:

```typescript
import {CommonRoutesConfig} from '../common/common.routes.config';
import UsersController from './controllers/user.controller';
import UsersMiddleware from './middleware/users.middleware';
import express from 'express';

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'UsersRoutes');
    }

    configureRoutes() {
        this.app.route(`/users`)
            .get(UsersController.listUsers)
            .post(
                UsersMiddleware.validateRequiredUserBodyFields,
                UsersMiddleware.validateSameEmailDoesntExist,
                UsersController.createUser);

        this.app.param(`userId`, UsersMiddleware.extractUserId);
        this.app.route(`/users/:userId`)
            .all(UsersMiddleware.validateUserExists)
            .get(UsersController.getUserById)
            .delete(UsersController.removeUser);

        this.app.put(`/users/:userId`,[
            UsersMiddleware.validateRequiredUserBodyFields,
            UsersMiddleware.validateSameEmailBelongToSameUser,
            UsersController.put
        ]);

        this.app.patch(`/users/:userId`, [
            UsersMiddleware.validatePatchEmail,
            UsersController.patch
        ]);

        return this.app;
    }
}
```

Here, we’ve redefined our routes by adding middleware to validate our business logic and the appropriate controller functions to process the request if everything is valid. We’ve also used the .param() function from Express.js to extract the userId.

At the .all() function, we are passing our validateUserExists function from UsersMiddleware to be called before any GET, PUT, PATCH, or DELETE can go through on the endpoint /users/:userId. This means validateUserExists doesn’t need to be in the additional function arrays we pass to .put() or .patch()—it will get called before the functions specified there.

We’ve leveraged the inherent reusability of middleware here in another way, too. By passing UsersMiddleware.validateRequiredUserBodyFields to be used in both POST and PUT contexts, we’re elegantly recombining it with other middleware functions.

Disclaimers: We only cover basic validations in this article. In a real-world project, you will need to think about and find all the restrictions you need to code. For the sake of simplicity, we are also assuming that a user cannot change their email.

## Run the application

npm start

## Testing Our Express/TypeScript REST API

We can now compile and run our Node.js app. Once it’s running, we’re ready to test our API routes using a REST client such as Postman or cURL.

Let’s first try to get our users:


```typescript
curl --request GET 'localhost:3000/users' \
--header 'Content-Type: application/json'
```

At this point, we will have an empty array as a response, which is accurate. Now we can try to create the first user resource with this:

```typescript
curl --request POST 'localhost:3000/users' \
--header 'Content-Type: application/json'
```

Note that now our Node.js app will send back an error from our middleware:

```json
{
   "error": "Missing required fields email and password"
}
```

To fix it, let’s send a valid request to post to /users resource:

curl --request POST 'localhost:3000/users' \
--header 'Content-Type: application/json' \
--data-raw '{
   "email": "nagentechno@gmail.com",
   "password": "s3creet"
}'

This time, we should see something like the following:

```json
{
    "id": "jQ4FGm9xo"
}
```

This id is the identifier of the newly created user and will be different on your machine. To make the remaining testing statements easier, you can run this command with the one you get (assuming you’re using a Linux-like environment):

```
REST_API_EXAMPLE_ID="put_your_id_here"
```

We can now see the response we get from making a GET request using the above variable:

```json
curl --request GET "localhost:3000/users/$REST_API_EXAMPLE_ID" \
--header 'Content-Type: application/json'
```

We can now also update the entire resource with the following PUT request:

```json
curl --request PUT "localhost:3000/users/$REST_API_EXAMPLE_ID" \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "nagentechno@gmail.com",
    "password": "s3creet",
    "firstName": "Nagendra",
    "lastName": "Prasad",
    "permissionLevel": 8
}'
```

We can also test that our validation works by changing the email address, which should result in an error.

Note that when using a PUT to a resource ID, we, as API consumers, need to send the entire object if we want to conform to the standard REST pattern. That means that if we want to update just the lastName field, but using our PUT endpoint, we will be forced to send the entire object to be updated. It would be easier to use a PATCH request since there it’s still within standard REST constraints to send just the lastName field:


```json
curl --request PATCH "localhost:3000/users/$REST_API_EXAMPLE_ID" \
--header 'Content-Type: application/json' \
--data-raw '{
    "lastName": "Prasad"
}'
```
Recall that in our own codebase, it’s our route configuration that enforces this distinction between PUT and PATCH using the middleware functions we added in this article.

```json
[
  {
    "id": "ksVnfnPVW",
    "email": "nagentechno@gmail.com",
    "password": "$argon2i$v=19$m=4096,t=3,p=1$ZWXdiTgb922OvkNAdh9acA$XUXsOHaRN4uVg5ltIwwO+SPLxvb9uhOKcxoLER1e/mM",
    "firstName": "Nagendra",
    "lastName": "Prasad",
    "permissionLevel": 8
  }
]
```

Finally, we can test deleting the user with this:

```json
curl --request DELETE "localhost:3000/users/$REST_API_EXAMPLE_ID" \
--header 'Content-Type: application/json'
```

Getting the user list again, we should see that the deleted user is no longer present.

With that, we have all the CRUD operations for the users resource working.


## Node.js/TypeScript REST API

In this part of the series, we further explored key steps in building a REST API using Express.js. We split our code to support services, middleware, controllers, and models. Each of their functions has a specific role, whether it’s validation, logical operations, or processing valid requests and responding to them.

We also created a very simple way to store data, with the (pardon the pun) express purpose of allowing some testing at this point, then being replaced with something more practical in the next part of our series.

Besides building an API with simplicity in mind—using singleton classes, for example—there are several steps to take to make it easier to maintain, more scalable, and secure. In our next article, we’ll cover:

* Replacing the in-memory database with MongoDB, then using Mongoose to simplify the coding process
* Adding a security layer and control access in a stateless approach with JWT
* Configuring automated testing to allow our application to scale