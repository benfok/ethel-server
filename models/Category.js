const { Schema, model } = require('mongoose');
const List = require('./List');

const categorySchema = new Schema({
    categoryName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    color: {
      type: String,
      required: true,
      default: '#C9CBCC',
    },
    userEditable: {
      type: Boolean,
      required: true,
      default: true
    },
    lists: [
      // creates an array of objects. This field is the Type of ObjectId (the Mongo specific id). The ref property connects this to the list model.
      {
        type: Schema.Types.ObjectId,
        ref: 'List'
      } 
    ],
  },
   // options object. Ensure that the virtuals are included.
    { 
        toJSON: { virtuals: true }
    }
);

// Creating a virtual property `listCount` and a getter
categorySchema.virtual('listCount')
.get(function () {
    return this.lists.length
});

const Category = model('Category', categorySchema);

module.exports = Category;