// ---------------------------------------
// Meteor Methods
// ---------------------------------------

Meteor.methods({
  createTicket: createTicket,
  claimTicket: claimTicket,
  completeTicket: completeTicket,
  cancelTicket: cancelTicket,
  deleteTicket: deleteTicket,
  reopenTicket: reopenTicket,
  createAnnouncement: createAnnouncement,
  deleteAnnouncement: deleteAnnouncement,
  toggleRole: toggleRole,
  updateUser: updateUser,
  createAccount: createAccount
});

function createTicket(topic, location, contact) {
  // Must be logged in
  if (authorized.user(this.userId)) {
    // User can't have more than one
    var userActiveTickets = Tickets.find(
        {
          userId: this.userId,
          status: {
            $in: ["OPEN", "CLAIMED"]
          }
        }).fetch();

    // You can't have more than one active ticket!
    if (userActiveTickets.length > 0) return;

    var user = _getUser(this.userId);

    Tickets.insert({
      userId: user._id,
      name: _getUserName(user),
      topic: topic,
      location: location,
      contact: contact,
      timestamp: Date.now(),
      status: "OPEN"
    });

    _log("Ticket Created by " + this.userId);
  }
}

function claimTicket(id){
  // Mentor only
  if (authorized.mentor(this.userId)){
    var user = _getUser(this.userId);
    Tickets.update({
      _id: id
    },{
      $set: {
        status: "CLAIMED",
        claimId: user._id,
        claimName: _getUserName(user),
        claimTime: Date.now()
      }
    });

    _log("Ticket Claimed by " + this.userId);
    return true;
  }
  return false;
}

function completeTicket(id){
  // Mentor only
  if (authorized.mentor(this.userId)){
    var user = _getUser(this.userId);
    Tickets.update({
      _id: id
    },{
      $set: {
        status: "COMPLETE",
        claimId: user._id,
        claimName: _getUserName(user),
        completeTime: Date.now()
      }
    });

    _log("Ticket Completed by " + this.userId);
    return true;
  }
  return false;
}

function reopenTicket(id){
  // Mentor only
  if (authorized.mentor(this.userId)){
    Tickets.update({
      _id: id
    },{
      $set: {
        status: 'OPEN',
        claimId: null,
        claimName: null
      }
    });
    _log("Ticket Reopened: " + id);
    return true;
  }
  return false;
}

function cancelTicket(id){

  // Ticket owner or mentor
  var ticket = Tickets.findOne({_id: id});

  if (authorized.mentor(this.userId) || ticket.userId === this.userId){
    Tickets.update({
      _id: id
    },{
      $set: {
        status: "CANCELLED"
      }
    });
    _log("Ticket Cancelled by " + this.userId);
    console.log("[", new Date().toLocaleString(), "]", "Ticket Cancelled by");
    return true;
  }
}

function deleteTicket(id){
  // Admin only
  if (authorized.admin(this.userId)){
    Tickets.remove({
      _id: id
    });
    _log("Ticket Deleted by " + this.userId);
  }
}

function createAnnouncement(header, content){
  if (authorized.admin(this.userId)){
    var user = _getUser(this.userId);
    Announcements.insert({
      userId: user._id,
      name: _getUserName(user),
      timestamp: Date.now(),
      header: header,
      content: content
    });
    _log("Announcement created by " + this.userId);
    return true;
  }
  return false
}

function deleteAnnouncement(id){
  if (authorized.admin(this.userId)){
    Announcements.remove({
      _id: id
    });
    _log("Announcement deleted by " + this.userId);
    return true;
  }
  return false;
}

function toggleRole(role, id){
  if (authorized.admin(this.userId)){
    // can only toggle available roles
    var roles = ["admin", "mentor"];
    if (roles.indexOf(role) < 0) return;

    var user = _getUser(id);
    var setRole = {};
    setRole['profile.' + role] = !user.profile[role];

    Meteor.users.update({
      _id: id
    },{
      $set: setRole
    });
    return true;
  }
}

// Admin or user
// Editable fields:
// Name, Email. Phone, Skills
function updateUser(id, profile){
  var user = _getUser(id);

  if (authorized.admin(this.userId) || user._id === this.userId){
    var validFields = [
      'name',
      'email',
      'phone'
    ];

    // Copy the user profile
    var userProfile = user.profile;

    // Pick valid fields from the submitted changes
    validFields.forEach(function(field){
      if (_.isString(profile[field])){
        userProfile[field] = profile[field];
      }
    });

    if(_.isArray(profile['skills'])){
      userProfile['skills'] = profile['skills'];
    }

    Meteor.users.update({
      _id: id
    },{
      $set: {
        profile: userProfile
      }
    }, function(err){
      return err;
    });
  }
}

// Only admin can create user accounts
function createAccount(username, password, profile){
  // TODO: validate username, password
  if (authorized.admin(this.userId)){
    Accounts.createUser({
      username: username,
      password: password,
      profile: profile ? profile : {}
    });
  }
}