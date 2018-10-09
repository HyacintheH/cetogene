'use strict';

module.exports = function(app) {
  let User = app.models.User;
  let Customer = app.models.Customer;

  let createUsers = function(customers) {
    let users = [];
    customers.forEach(function(customer) {
      let user = {
        username: customer.email,
        email: customer.email,
        password: customer.email,
      };
      users.push(user);
    });

    User.create(users);

    User.find({order: 'email ASC'}, function(err, users) {
      users.forEach(function(user) {
        Customer.updateAll({email: user.email}, {userId: user.id});
      });
    });
  };

  Customer.find({fields: {email: true}, limit: 50}, function(err, customers) {
    createUsers(customers);
  });
};

