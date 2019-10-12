const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const ApolloClient = require('apollo-boost').default;
const gql = require('graphql-tag');
const request = require('request');
const bodyParser = require('body-parser');
require('cross-fetch/polyfill');
 
const client = new ApolloClient({
    uri: 'https://super-power.herokuapp.com/v1/graphql',
    request: operation => {
        operation.setContext({
            headers: {
                'X-Hasura-Admin-Secret': 'highlysecureshit',
            },
        });
    },
});
var app = express();
 
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app
    .get('/', (req, res) => res.render('pages/index'))
    .get('/sendPushNotifications', (req, res) => res.send('Notifications will be sent soon'));


    app.post('/addCommit', (req, res) => {
      client.mutate({
        mutation: gql`
        mutation make_commit($commitLog: String!) {
          insert_commits(objects: {commit_log: $commitLog}) {
            affected_rows
            returning {
              id
            }
          }
        }
        `,
        variables: {
          commitLog: req.body.changeLog
        }
      }).then((data) => {
        console.log(data);
        client.mutate({
          mutation: gql`
          mutation ($commitId: Int!, $pageUrl: String!) {
            insert_url_commit_log(objects: {commit: $commitId, url: $pageUrl}) {
              affected_rows
            }
          }
          `,
          variables: {
            commitId: data.data.returning,
            pageUrl: req.body.pageUrl
          }
        }).then(() => {
          res.send("Commit Inserted!!")
        }).catch((e) => console.log(e));
      })
    })
 

app.post('/fetchcommit', (req, res) => {
  client.query({
    query: gql`
    query fetch_commit ($pageUrl: String!){
      url_commit_log(where: {url: {_eq: $pageUrl}}) {
        url
        commitByCommit {
          commit_log
          id
        }
      }
    }
    `,
    variables: {
      pageUrl: req.body.pageUrl
    }
    }).then((data) => {
      res.send(data);
    }).catch((e) => console.log(e));
  });
     
 
app.listen(PORT, () => console.log(`Listening on ${PORT}`));