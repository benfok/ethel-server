const { Schema, model } = require('mongoose');
const { formatDate } = require('../utils/utils');

// created as a nested schema within users
const itemSchema = new Schema({
      itemText: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },
      completed: {
        type: Boolean,
        required: true,
        default: false,
      },
    }
);

  const listSchema = new Schema({
    listName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30,
    },
    owner: {
        type: Schema.Types.ObjectId
    },
    items: [itemSchema],
    sharedList: {
      type: Boolean,
      required: true,
      default: false
    },
    sharedWith: [
        // creates an array of select user objects
        {
          userId: Schema.Types.ObjectId, 
          firstName: String, 
          lastName: String,
          email: String
        } 
    ],
    createdAt: {
        type: Date,
        default: Date.now(),
        get: formatDate
    },
  },
 // options object. Ensure that the virtuals are included.
    {
        toJSON: { virtuals: true }
    }
);

// Creating a virtual property `itemCount` and a getter
listSchema.virtual('itemCount')
    .get(function () {
        return this.items.length
    });

const List = model('List', listSchema);

module.exports = List;