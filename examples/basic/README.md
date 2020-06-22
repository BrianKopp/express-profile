# Basic Example

This is an example that does not use any authentication.

**DO NOT USE THIS IN PRODUCTION**

This example gives you a quick way to start using the profiler endpoints.

## Quick Start

```sh
git clone https://github.com/briankopp/express-profile
cd express-profile
npm install
npm run build

cd examples/basic
npm install
npm run start

# in another shell
curl localhost:3000/profiler/cpu > example.cpuprofile
```

In chrome, open developer tools, go to Performance tab, click the upload icon,
find the `example.cpuprofile` file, and then observe the results.
