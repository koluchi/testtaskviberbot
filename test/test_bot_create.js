const mongoose = require('mongoose');
const test = require('tape');
const request = require('supertest');
const app = require('../app.js');
const Bot = mongoose.model('Bot');
const User = mongoose.model('User');
const Message = mongoose.model('Message');

test('CleanUp', t => {
    Message.remove()
    .then(()=>{
        return User.remove();
    })
    .then(()=>{
        return Bot.remove();
    })
    .then(()=>{
        t.end();
    });
});

test('no name - should respond with errors', t => {
  request(app)
  .post('/Web/bots')
  .type("json")
  .send({'name': '','paToken': '456b3f907bb5a8bb-0b98a0e1589af854-7af73135028b007a', 'webhookURL': 'whvb'})
  .expect('Content-Type', /json/)
  .expect(201)
  .expect(/Название не может быть пустым!/)
  .end(err => {
    Bot.count().exec()
    .then(count=>{
        t.ifError(err);
        t.same(count, 0, 'count of bots should be 0');
        t.end();
    });
    
  });
});


test('no paToken - should respond with errors', t => {
  request(app)
  .post('/Web/bots')
  .type("json")
  .send({'name': 'Тупой бот','paToken': '', 'webhookURL': ''})
  .expect('Content-Type', /json/)
  .expect(201)
  .expect(/URL не может быть пустым! Токен не может быть пустым!/)
  .end(err => {
    Bot.count().exec()
    .then(count=>{
        t.ifError(err);
        t.same(count, 0, 'count of bots should be 0');
        t.end();
    });
  });
});


test('valid - should respond with no errors', t => {
  request(app)
  .post('/Web/bots')
  .type("json")
  .send({'name': 'Тупой бот','paToken': '456b3f907bb5a8bb-0b98a0e1589af854-7af73135028b007a', 'webhookURL': 'whvb'})
  .expect('Content-Type', /json/)
  .expect(201)
  .end(err => {
    Bot.count().exec()
    .then(count=>{
        t.ifError(err);
        t.same(count, 1, 'count of bots should be 1');
        t.end();
    });
  });
});


test('valid - should respond with no errors', t => {
  request(app)
  .post('/Web/bots')
  .type("json")
  .send({'name': 'Новый бот','paToken': '457e9f257ef0dab8-a3d869f34c57d171-4f3510d12963ce22', 'webhookURL': 'whvb1'})
  .expect('Content-Type', /json/)
  .expect(201)
  .end(err => {
    Bot.count().exec()
    .then(count=>{
        t.ifError(err);
        t.same(count, 2, 'count of bots should be 2');
        t.end();
    });
  });
});