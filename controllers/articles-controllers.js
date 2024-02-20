const { selectArticleById, selectArticles } = require('../models/articles-models');

exports.getArticleById = (req, res, next) => {
    const { article_id } = req.params;
    selectArticleById(article_id).then((article) => {
        res.status(200).send({ article });
    }).catch((err) => {
        next(err);
    });
};

exports.getArticles = (req, res, next) => {
    selectArticles().then((articles) => {
        console.log(articles, 'in controller')
        res.status(200).send({ articles });
    });
}