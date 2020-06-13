# Express Profile

A simple express middleware to expose nodejs profiling functions
so you can profile your applications with zero downtime.

## Quick Start

Check out a functioning example!

```sh
git clone https://github.com/briankopp/express-profile
cd express-profile/examples/simple-with-html
npm run start
# listening on port 3000
# in browser, navigate to http://localhost:3000/inspect/cpu-profile
```

Or, use it in your project!

`npm install express-profile`

```js
const app = require('express')();
const { exposeProfiler } = require('express-profile');
app.use('/inspect', exposeProfile());
```

## How It Works

`express-profile` leverages the `inspector` module that comes
out of the box with nodejs. The `inspector` module provides
CPU and memory profiling, and can be invoked in a running
application. That means you can run your application using
`node index.js` just like you always do. No more running your
performance-critical production workload as a sad subprocess
of a profiling software.

`express-profile` exposes API endpoints that can be accessed
by your application, takes a profiling sample of your
live running application, and returns the results.
