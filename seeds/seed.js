const db = require('../config/connection');
const { User, List } = require('../models');
const userSeed = require('./userData.json');
const listSeed = require('./listData.json');
const categorySeed = require('./categoryData.json');

db.once('open', async () => {
    try {
        await User.deleteMany({});
        await List.deleteMany({});

        const listArray = [];

        const user = await User.create(userSeed);

        const createLists = async (data) => {
            for(let i = 0; i < data.length; i++) {
                const list = data[i];
                list.owner = user[0]._id
                await List.create(list)
                    .then((list) => {
                        listArray.push(list._id)
                    })               
            }
        }

        const addListsToCategories = (lists) => {
            let catData = categorySeed;
            catData[1].lists = [lists[0], lists[1], lists[2]];
            catData[2].lists = [lists[3]];
            catData[3].lists = [lists[4], lists[5]];

            return catData;
        };

        const addCategoriesToUser = async () => {
            const completeCatagoryData = addListsToCategories(listArray);
            await User.findByIdAndUpdate(
                user[0]._id, { categories: completeCatagoryData },
                {
                    new: true
                }
            )
        }        

        await createLists(listSeed);
        await addCategoriesToUser(user);    

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
    
      console.log('all done!');
      process.exit(0);
});