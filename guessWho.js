let DBMS = require('./RDBMS.js');

//Table of all people
let tblPeople = new DBMS('tblPeople', './data/people.dat');
tblPeople.field('given', 'string', 10);
tblPeople.field('family', 'string', 10);
tblPeople.field('description', 'string', 50);

//Table of all questions
let tblQuestion = new DBMS('tblQuestion', './data/question.dat');
tblQuestion.field('prompt', 'string', 100);

//Table linking people to matching questions (Only True cases)
let tblMatch = new DBMS('tblMatch', './data/match.dat');
tblMatch.link(tblPeople);
tblMatch.link(tblQuestion);
tblMatch.field('PersonID', '#tblPeople');
tblMatch.field('QuestionID', '#tblQuestion');





function init(){
  console.log('all tables ready');
}





// Build all tables
tblPeople.build().then(()=>{
  tblQuestion.build().then(()=>{
    tblMatch.build().then(()=>{
      init();
    })
  });
});