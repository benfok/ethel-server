const express = require('express');
const path = require('path');
const db = require('./config/connection');

// Import the ApolloServer class
const { ApolloServer } = require('apollo-server-express');
// Import the two parts of a GraphQL schema
const { typeDefs, resolvers } = require('./schemas');
const { authMiddleware } = require('./utils/auth');

const PORT = process.env.PORT || 3001;
const app = express();

// create a new apollo server
// include middleware to handle tokens within the body of requests
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// connect the apollo server with GraphQL schema and start prior to starting app. 
const startApolloServer = async () => {
    await server.start();
    // connect express server and GraphQL (Apollo) server
    server.applyMiddleware({ app });

    // connect to the DB and then start the app server
    db.once('open', () => {
    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}!`);
        console.log(`Use GraphQL at ${server.graphqlPath}`);
    })
    })
};

// Call the async function to start the server
startApolloServer(typeDefs, resolvers);