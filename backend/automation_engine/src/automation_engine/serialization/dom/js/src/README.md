### Build Instructions

1. Navigate to the source directory:

   ```
   cd js/src
   ```

2. Initialize a Node.js project (if not already initialized):

   ```
   npm init -y
   ```

3. Install build dependencies:

   ```
   npm install --save-dev webpack webpack-cli
   ```

4. Run the build:

   ```
   npx webpack
   ```

### Output

The build will generate a bundled file named `dom_serializer.bundle.js`.


### Notes

* Ensure `webpack.config.js` is present in the same directory where you run the build command.
