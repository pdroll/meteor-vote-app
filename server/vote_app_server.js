
 //
 // Set up Facebook, Twitter & Google Login on Startup
	Meteor.startup(function () {

		Accounts.loginServiceConfiguration.remove({
			service : 'facebook'
		});

		Accounts.loginServiceConfiguration.remove({
			service : 'twitter'
		});

		Accounts.loginServiceConfiguration.remove({
			service : 'google'
		});

		Accounts.loginServiceConfiguration.insert(Meteor.settings.facebookSettings);
		Accounts.loginServiceConfiguration.insert(Meteor.settings.twitterSettings);
		Accounts.loginServiceConfiguration.insert(Meteor.settings.googleSettings);
	});

  	//
  	// Server Methods
	Meteor.methods({
		onLogin: function() {
			var admins =  JSON.parse(Assets.getText('admins.json')),
				user = Meteor.user(),
				isAdmin = user.services.facebook ? admins.indexOf(user.services.facebook.id) > -1 : false,
				$set = {},
				voteSetting = Settings.findOne({name : 'votesPerUser'});


			if(!voteSetting){
				Settings.insert({name : 'votesPerUser', value : 5});
				voteSetting = Settings.findOne({name : 'votesPerUser'});
			}

			if(typeof user.votes == 'undefined'){
				$set.votes = voteSetting.value;
			}

			if(user.services.facebook){
				$set.profileLink = user.services.facebook.link;
			} else if(user.services.twitter){
				$set.profileLink = 'http://www.twitter.com/' + user.services.twitter.screenName;
			} else if(user.services.google){
				$set.profileLink = user.services.google.email;
			}

			$set.isAdmin = isAdmin;
			Meteor.users.update({_id:Meteor.user()._id}, { $set: $set });
		},
		reset : function(){
			if(Meteor.user().isAdmin){
				// Remove Nominees
				Nominees.remove({});
				// Remove Nominee Votes
				NomineeVotes.remove({});
				// Reset Title
				Settings.remove({name: 'title'});
				// Reset user votes
				Meteor.users.update({}, { $set: {votes : Settings.findOne({name : 'votesPerUser'}).value }}, {multi: true});
			}
		},
		addUserVote : function(){
			var user = Meteor.user();
			Meteor.users.update({_id : user._id},{$set : {votes: (user.votes + 1)}});
		},
		removeUserVote : function(){
			var user = Meteor.user();
			Meteor.users.update({_id : user._id},{$set : {votes: (user.votes - 1)}});


		}
	});


	//
	// Publish isAdmin & votes field if searching by ID
	Meteor.publish('userData', function() {
		if(!this.userId) return null;
		return Meteor.users.find(this.userId, {fields: {
			isAdmin: 1,
			votes: 1
		}});
	});

	//
	// Publish votes and profileLink fields only to Admins
	Meteor.publish("allUserData", function () {

		var user = Meteor.users.findOne({_id : this.userId});
		if(!user.isAdmin) return null;

		return Meteor.users.find({}, {fields: {
			votes: 1,
			profileLink: 1
		}});
	});
