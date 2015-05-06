Template.leaderboard.onCreated(function(){
  this.subscribe("allTickets");
  this.subscribe("allMentors");
  this.rows = new ReactiveVar();

  // TODO: Expand to more
  this.rows.set(10);
});

Template.leaderboard.helpers({
  topMentors: function(){
    // Return the top number of mentors
    return topMentors(Template.instance().rows.get());
  }
});

// Ranking algorithm based on number of ratings and quality of ratings.
function topMentors(num){
  var mentors = {};
  var tickets = Tickets.find({
    status: "COMPLETE"
  }).fetch();

  // Each mentor has a set of ratings
  tickets.forEach(function(t){
    if (t.claimId){
      if (!mentors[t.claimId]) {
        mentors[t.claimId] = {
          ratings: []
        }
      }
      mentors[t.claimId].ratings.push(t.rating);
    }
  });

  var ids = Object.keys(mentors);
  return ids.map(function(id){
    return {
      profile: Meteor.users.findOne({_id: id}).profile,
      rating: laplaceSmooth(mentors[id].ratings),
      numTickets: mentors[id].ratings.length
    }
  }).sort(function(a, b){
    return b.rating - a.rating;
  }).map(function(mentor, idx){
    mentor.index = idx;
    return mentor;
  }).slice(0, num);

}

function laplaceSmooth(x){
  var alpha = 6,
      beta  = 2,
      sum  = stats.sum(x);
  return ((sum + alpha)/(x.length + beta)).toFixed(1);
}