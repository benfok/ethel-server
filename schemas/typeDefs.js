const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    _id: ID
    firstName: String
    lastName: String
    email: String
    password: String
    categories: [Category]
    shareHistory: [User]
  }

  type Category {
      _id: ID
      categoryName: String
      user: ID
      color: String
      userEditable: Boolean
      lists: [List]
  }

  type List {
      _id: ID
      listName: String
      owner: String
      items: [Item]
      sharedList: Boolean
      sharedWith: [User]
      createdAt: String
  }

  type Item {
      _id: ID
      itemText: String
      completed: Boolean
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    category(categoryId: ID!): User
    currentUser: User
    list(listId: ID!): List
    users: [User]
  }

  type Mutation {
    addUser(firstName: String!, lastName: String! email: String!, password: String!): Auth
    login(email: String!, password: String!): Auth
    addItem(listId: ID!, itemText: String!): List
    removeItem(listId: ID!, itemId: ID!): List
    toggleItem(listId: ID!, itemId: ID!, checked: Boolean!): List
    addCategory(categoryName: String!, color: String!): User
    addList(listName: String!, owner: ID!, categoryId: ID!): List
    removeList(listId: ID!, categoryId: ID!): List
    shareList(listId: ID!, sharedWithId: ID!): List
    updateShareHistory(sharedWithId: ID!): User
    moveList(listId: ID!, oldCategoryId: ID!, newCategoryId: ID!): User
  }
`;

module.exports = typeDefs;
