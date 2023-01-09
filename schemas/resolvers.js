const { AuthenticationError } = require('apollo-server-express');
const { User, List, Category } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    currentUser: async (parent, args, context) => {
        if (context.user) {
          return await User.findOne({ _id: context.user._id }).populate({path: 'categories.lists', populate: 'items'});
        }
        throw new AuthenticationError('You need to be logged in!');
    },

    list: async (parent, {listId}, context) => {
      if (context.user) {
        return await List.findById(listId).populate('items');
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    users: async (parent, args, context) => {
      if(context.user) {
        return await User.find({}).select("firstName lastName email");
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Mutation: {
    addUser: async (parent, { firstName, lastName, email, password }) => {
      // insert default category upon user creation
      const categories = [{
        categoryName: "Uncategorized", 
        color: "#8D8896",
        userEditable: false,
        lists: []
      }];
      const user = await User.create({ firstName, lastName, email, password, categories });
      const token = signToken(user);
      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }
      //isCorrectPassword is set on the User model
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }
      const token = await signToken(user);
      return { token, user };
    },

    addCategory: async (parent, { categoryName, color }, context) => {
      if(context.user) {
          const user = await User.findByIdAndUpdate(
            { _id: context.user._id },
            { $push: { categories: {
                categoryName: categoryName,
                color: color,
                lists: []
            }}},
            { new: true }
          )
          return user
        }
        throw new AuthenticationError('You need to be logged in to add a category');
    },

    addItem: async (parent, { listId, itemText }, context) => {
      if(context.user) {
        const list = await List.findOneAndUpdate(
          { _id: listId },
          { $push: { items: { itemText: itemText } } },
          { new: true }
        )
        return list
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    removeItem: async (parent, { listId, itemId }, context) => {
      if(context.user) {
        const list = await List.findOneAndUpdate(
          { _id: listId },
          { $pull: { items: { _id: itemId } } },
          { new: true }
        )
        return list;
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    toggleItem: async (parent, { listId, itemId, checked }, context) => {
      if(context.user) {
       const list = List.findOneAndUpdate(
          { "_id": listId, "items._id": itemId },
          { $set: { "items.$.completed" : checked }},
          { new: true }
        )
        return list;
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    addList: async (parent, { listName, owner, categoryId }, context) => {
      if(context.user) {
        
        const list = await List.create(
            { 
              listName,
              owner,
              items: [],
              sharedWith: [],
            }
        );

        const addListToUser = async (list) => {
          await User.findOneAndUpdate(
            { "_id": owner, "categories._id" : categoryId },
            { $push: { "categories.$.lists" :  list._id }},
            { new: true }
          )
        }

        await addListToUser(list)

        return list
     }
      throw new AuthenticationError('You need to be logged in!');
    },

    removeList: async (parent, { listId, categoryId }, context) => {
      if(context.user) {
        const list = await List.findOneAndDelete({ _id: listId })

        const removeListFromUserCategory = async (list) => {
          await User.findOneAndUpdate(
            { "_id": context.user._id, "categories._id" : categoryId },
            { $pull: { "categories.$.lists" :  listId }},
            { new: true }
          )
        }

        await removeListFromUserCategory(list)
        return list
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    shareList: async (parent, { listId, sharedWithId }, context) => {
      if(context.user) {
        // first collect relevant data about the shared user
        const sharedWith = await User.findById(sharedWithId).select("firstName lastName email")

        //update the list document and set it as a shared list
        const list = await List.findOneAndUpdate(
          { _id: listId },
          { 
            $set: { sharedList: true },
            $push: { sharedWith: {
              _id : sharedWithId,
              firstName: sharedWith.firstName,
              lastName: sharedWith.lastName,
              email: sharedWith.email
            }}
          },
          { new: true }
        )

        // add the list to the shared Users "uncategorized" category. This is always index 0 of the categories array. Also add the shared user to the list owner's share history
        const updateUser = async () => {
          await User.findOneAndUpdate(
            { "_id": sharedWithId },
            { 
              $push: { "categories.0.lists" :  listId }     
            },
            { new: true }
          )
        }

        await updateUser();

        return list
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    updateShareHistory: async (parent, { sharedWithId }, context) => {
      if(context.user) {
        // first collect relevant data about the shared user
        const sharedWith = await User.findById(sharedWithId).select("firstName lastName email")         
        // add the shared user to the list owner's share history
          const user = await User.findOneAndUpdate(
            { "_id": context.user._id },
            { 
              $push: { shareHistory: {
                _id : sharedWith._id,
                firstName: sharedWith.firstName,
                lastName: sharedWith.lastName,
                email: sharedWith.email
              }}         
            },
            { new: true }
          )
          return user;
      }
      throw new AuthenticationError('You need to be logged in!');
    },

    moveList: async (parent, { listId, oldCategoryId, newCategoryId }, context) => {
      if(context.user) {

        // add list to new category
        const user = await User.findOneAndUpdate(
            { "_id": context.user._id, "categories._id" : newCategoryId },
            { $push: { "categories.$.lists" :  listId }}
          )

        // pull list from old category
        const moveListFromCat = async () => {
          await User.findOneAndUpdate(
            { "_id": context.user._id, "categories._id" : oldCategoryId },
            { $pull: { "categories.$.lists" :  listId }},
            { new: true }
          )
        }
        
        await moveListFromCat();

        return user;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;
