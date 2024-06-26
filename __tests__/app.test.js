const app = require('../app');
const request = require('supertest');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const testData = require('../db/data/test-data/index');
const apiData = require('../endpoints.json');


beforeEach(() => {
    return seed(testData);
});
afterAll(() => db.end());


describe('/api/topics', () => {
    test('GET:200 sends an array of topic objects', () => {
        return request(app)
            .get('/api/topics')
            .expect(200)
            .then((response) => {
                expect(response.body.topics.length).toBe(3);
                response.body.topics.forEach((topic) => {
                    expect(typeof topic.slug).toBe('string');
                    expect(typeof topic.description).toBe('string');
                });
            });
    });
});

describe('path not found', () => {
    test('GET:404 returns error for invalid route', () => {
        return request(app)
            .get('/notvalid')
            .expect(404)
            .then((response) => {
                const error = response.body;
                expect(error.msg).toBe('path not found');
            });
    });
});

describe('/api', () => {
    test('GET:200 sends description of all available endpoints', () => {
        return request(app)
            .get('/api')
            .expect(200)
            .then((response) => {
                expect(response.body.endpoints).toEqual(apiData);
            });
    });
});

describe('/api/articles/:article_id', () => {
    test('GET:200 sends a single article to the client', () => {
        return request(app)
            .get('/api/articles/3')
            .expect(200)
            .then((response) => {
                const { article } = response.body;
                expect(article.title).toBe('Eight pug gifs that remind me of mitch');
                expect(article.topic).toBe('mitch');
                expect(article.author).toBe('icellusedkars');
                expect(article.body).toBe('some gifs');
                expect(article.created_at).toBe('2020-11-03T09:12:00.000Z');
                expect(article.votes).toBe(0);
                expect(article.article_img_url).toBe('https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700');
            });
    });
    test('GET:200 sends a single article including comment count', () => {
        return request(app)
            .get('/api/articles/1')
            .expect(200)
            .then((response) => {
                const { article } = response.body;
                expect(article.comment_count).toBe(11);
            });
    });
    test('GET:404 sends error message when given a valid but non-existent article id', () => {
        return request(app)
            .get('/api/articles/99')
            .expect(404)
            .then((response) => {
                expect(response.body.msg).toBe('page not found');
            });
    });
    test('GET:400 sends error message when given an invalid article id', () => {
        return request(app)
            .get('/api/articles/not-a-number')
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
    test('PATCH:200 updates article (increments votes) in db and sends updated article back to client', () => {
        const updatedArticle = { inc_votes: 2 };
        return request(app)
            .patch('/api/articles/3')
            .send(updatedArticle)
            .expect(200)
            .then((response) => {
                const { article } = response.body;
                expect(article.votes).toBe(2);
            });
    });
    test('PATCH:404 sends error message when given a valid but non-existent article id', () => {
        const updatedArticle = { inc_votes: 2 };
        return request(app)
            .patch('/api/articles/99')
            .send(updatedArticle)
            .expect(404)
            .then((response) => {
                expect(response.body.msg).toBe('not found');
            });
    });
    test('PATCH:400 sends error message when given an invalid article id', () => {
        const updatedArticle = { inc_votes: 2 };
        return request(app)
            .patch('/api/articles/not-a-number')
            .send(updatedArticle)
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
    test('PATCH:400 sends error message when request body contains value of incorrect type', () => {
        const updatedArticle = { inc_votes: 'not-a-number' };
        return request(app)
            .patch('/api/articles/3')
            .send(updatedArticle)
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
});

describe('/api/articles', () => {
    test('GET:200 sends an array of article objects', () => {
        return request(app)
            .get('/api/articles/')
            .expect(200)
            .then((response) => {
                const { articles } = response.body;
                expect(articles.length).toBe(13);
                articles.forEach((article) => {
                    expect(typeof article.author).toBe('string');
                    expect(typeof article.title).toBe('string');
                    expect(typeof article.article_id).toBe('number');
                    expect(typeof article.topic).toBe('string');
                    expect(typeof article.created_at).toBe('string');
                    expect(typeof article.votes).toBe('number');
                    expect(typeof article.article_img_url).toBe('string');
                    expect(typeof article.comment_count).toBe('number');
                });
            });
    });
    test('GET:200 array of articles should be sorted by date in descending order', () => {
        return request(app)
            .get('/api/articles/')
            .expect(200)
            .then((response) => {
                const { articles } = response.body;
                expect(articles).toBeSorted({ key: 'created_at', descending: true });
            });
    });
    test('GET:200 should take optional topic query and respond with articles filtered by specified topic', () => {
        return request(app)
            .get('/api/articles?topic=cats')
            .expect(200)
            .then((response) => {
                const { articles } = response.body;
                expect(articles.length).toBe(1);
                articles.forEach((article) => {
                    expect(article.topic).toBe('cats');
                })
            });
    });
    test('GET:200 sends empty array when given topic that exists but has no associated articles', () => {
        return request(app)
            .get('/api/articles?topic=paper')
            .expect(200)
            .then((response) => {
                const { articles } = response.body;
                expect(articles.length).toBe(0);
            });

    });
    test('GET:404 sends error message when given non-existent topic', () => {
        return request(app)
            .get('/api/articles?topic=no-such-topic')
            .expect(404)
            .then((response) => {
                expect(response.body.msg).toBe('not found');
            });
    });
});

describe('/api/articles/:article_id/comments', () => {
    test('GET:200 sends an array of comment objects for given article id', () => {
        return request(app)
            .get('/api/articles/1/comments')
            .expect(200)
            .then((response) => {
                const { comments } = response.body;
                expect(comments.length).toBe(11);
                comments.forEach((comment) => {
                    expect(typeof comment.comment_id).toBe('number');
                    expect(typeof comment.votes).toBe('number');
                    expect(typeof comment.created_at).toBe('string');
                    expect(typeof comment.author).toBe('string');
                    expect(typeof comment.body).toBe('string');
                    expect(typeof comment.article_id).toBe('number');
                });
            });
    });
    test('GET:200 array of comments should be sorted by date in descending order', () => {
        return request(app)
            .get('/api/articles/1/comments')
            .expect(200)
            .then((response) => {
                const { comments } = response.body;
                expect(comments).toBeSorted({ key: 'created_at', descending: true });
            });
    });
    test('GET:404 sends error message when given valid but non-existent article id', () => {
        return request(app)
            .get('/api/articles/99/comments')
            .expect(404)
            .then((response) => {
                expect(response.body.msg).toBe('page not found');
            });
    });
    test('GET:400 sends error message when given invalid article id', () => {
        return request(app)
            .get('/api/articles/not-a-number/comments')
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
    test('GET:200 sends empty array when given article id that exists but has no comments', () => {
        return request(app)
            .get('/api/articles/2/comments')
            .expect(200)
            .then((response) => {
                const { comments } = response.body;
                expect(comments.length).toBe(0);
            });
    });
    test('POST:201 inserts comment into db and sends posted comment back to client', () => {
        const newComment = {
            username: 'rogersop',
            body: 'very nice laptop'
        };
        return request(app)
            .post('/api/articles/2/comments')
            .send(newComment)
            .expect(201)
            .then((response) => {
                const { comment } = response.body;
                expect(comment.comment_id).toBe(19);
                expect(comment.body).toBe('very nice laptop');
                expect(comment.article_id).toBe(2);
                expect(comment.author).toBe('rogersop');
                expect(comment.votes).toBe(0);
                expect(typeof comment.created_at).toBe('string');
            });
    });
    test('POST:400 sends error message when given valid but non-existent article id', () => {
        const newComment = {
            username: 'rogersop',
            body: 'very nice laptop'
        };
        return request(app)
            .post('/api/articles/99/comments')
            .send(newComment)
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
    test('POST:400 sends error message when given invalid article id', () => {
        const newComment = {
            username: 'rogersop',
            body: 'very nice laptop'
        };
        return request(app)
            .post('/api/articles/not-a-number/comments')
            .send(newComment)
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
    test('POST:400 sends error message when request body is missing required fields', () => {
        const newComment = {
            body: 'very nice laptop'
        };
        return request(app)
            .post('/api/articles/2/comments')
            .send(newComment)
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
});

describe('/api/comments/:comment_id', () => {
    test('DELETE:204 deletes specified comment from db and sends no body back', () => {
        return request(app)
            .delete('/api/comments/7')
            .expect(204)
    });
    test('DELETE:404 sends error message when given non-existent comment id ', () => {
        return request(app)
            .delete('/api/comments/1234')
            .expect(404)
            .then((response) => {
                expect(response.body.msg).toBe('not found');
            })
    });
    test('DELETE:400 sends error message when given invalid comment id', () => {
        return request(app)
            .delete('/api/comments/not-a-number')
            .expect(400)
            .then((response) => {
                expect(response.body.msg).toBe('bad request');
            });
    });
});




describe('/api/users', () => {
    test('GET:200 sends an array of user objects', () => {
        return request(app)
            .get('/api/users')
            .expect(200)
            .then((response) => {
                expect(response.body.users.length).toBe(4);
                response.body.users.forEach((user) => {
                    expect(typeof user.username).toBe('string');
                    expect(typeof user.name).toBe('string');
                    expect(typeof user.avatar_url).toBe('string');
                });
            });
    });
});


