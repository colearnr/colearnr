var platform_plans = {

    "lite": {
        power: 10,
        max_users: 5,
        max_topics: 100,
        max_learnbits: 500,
        max_collaborators: 5
    },

    "silver": {
        power: 20,
        max_users: 25,
        max_topics: 500,
        max_learnbits: 2500,
        max_collaborators: 20
    },

    "gold": {
        power: 40,
        max_users: 100,
        max_topics: 2000,
        max_learnbits: 10000,
        max_collaborators: 50
    },

    "platinum": {
        power: 80,
        max_users: 250,
        max_topics: 5000,
        max_learnbits: 30000,
        max_collaborators: 50
    },

    "unlimited": {
        power: 1000,
        max_users: -1,
        max_topics: -1,
        max_learnbits: -1,
        max_collaborators: -1
    }
};

module.exports = platform_plans;
