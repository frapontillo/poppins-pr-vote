var _ = require('lodash');
var Q = require('q');
var Abacus = require('./lib/abacus');

var poppins, prVote;

var yaysTag = '[pr-vote-yays]:';
var naysTag = '[pr-vote-nays]:';
var noVoteTag = '[pr-vote-no]:true';

var noVotesYet = 'There are no votes for this PR yet.\n';
var voteInfo;
var paragraphsJoin = '\n\n';

module.exports = function initPlugin(pop) {
  poppins = pop;

  prVote = poppins.plugins.prVote = _.defaults(poppins.plugins.prVote || {}, {

    greeting: 'Thanks for the PR!',
    responseBody: 'Yays: <%= yays %>\nNays: <%= nays %>\nEntropy: <%= entropy %>',
    closing: 'Farewell.',

    voteYay: ':+1:',
    voteNay: ':x:',

    labelEntropyLow: 'pr:nice',
    labelEntropyHigh: 'pr:mess',
    labelYay: 'pr:yay',
    labelNay: 'pr:nay',

    thresholdMaxLowEntropy: 0.45,
    thresholdMinHighEntropy: 0.65,
    thresholdAcceptableVote: 0.65

  });

  voteInfo = 'You can vote by posting `' +
  prVote.voteYay + '` for a positive vote or `' +
  prVote.voteNay + '` for a negative vote.\n';

  poppins.on('pullRequestOpened', function (data) {
    handleFirstResponse(data.pull_request.number)
      .done(function () {
        poppins.emit('plugin:pr:done');
      });
  });
  poppins.on('issueCommentCreated', function (data) {
    handleIssueComment(data)
      .done(function () {
        poppins.emit('plugin:ic:done');
      });
  });
  poppins.on('pullRequestCommentCreated', function(data) {
    handlePullRequestDiffComment(data)
      .done(function () {
        poppins.emit('plugin:prc:done');
      });
  });
};

/**
 * Handles a new issue for the first time (creation of Pull Request or enabling of mary-poppins on existing issues)
 * by responding to the corresponding issue, opening a vote.
 *
 * @param issueNumber - The number of the issue/pull request.
 * @returns {Promise} that will be resolved when the comment is added on the PR thread.
 */
function handleFirstResponse(issueNumber) {
  return Q.fcall(
    function () {
      return buildResponseBody();
    })
    .then(function (paragraphs) {
      return paragraphs.join(paragraphsJoin);
    })
    .then(function (body) {
      return poppins.createComment(issueNumber, body);
    })
    .then(function (newComment) {
      return newComment;
    })
    .fail(commonFail);
}

/**
 * Handles a new issue comment by searching for a valid vote.
 *
 * @param data - The created Comment.
 * @returns A {Promise} resolved when the new issue comment is searched for a vote
 *          and the global results are eventually updated.
 */
function handleIssueComment(data) {
  return Q.fcall(
    function () {
      // discard if the comment is not PR-related or the vote must not be cast/is invalid
      var vote;
      if (!isPullRequestComment(data) || (vote = getVoteFromComment(data)) === 0) {
        throw new Error('The comment is not PR-related or the vote is invalid.');
      }
      return [vote, data.issue];
    })
    .spread(updateCommentAndLabels)
    .fail(commonFail);
}

/**
 * Handles a new PR diff comment by searching for a valid vote.
 *
 * @param data - The created Diff Comment.
 * @returns A {Promise} resolved when the new diff comment is searched for a vote
 *          and the global results are eventually updated.
 */
function handlePullRequestDiffComment(data) {
  return Q.fcall(
    function () {
      // discard if the vote must not be cast/is invalid
      var vote = getVoteFromComment(data);
      if (vote === 0) {
        throw new Error('The vote is invalid.');
      }
      return [vote, poppins.getIssue(data.pull_request.number)];
    })
    .spread(updateCommentAndLabels)
    .fail(commonFail);
}

/**
 * Counts the new vote result from a new vote, updating an issue:
 *   - first, it gets the first comment, inserted by poppins
 *   - then, it calculates the new vote counts (yays, nays, entropy)
 *   - finally, it simultaneously updates the poppins initial comment and edits the issue labels
 *
 * @param newVote - The new vote as a {Number}.
 * @param issue - The original issue {Object} to update.
 * @returns {Promise} that will be resolved as an {Array} of updated comment and labels.
 */
function updateCommentAndLabels(newVote, issue) {
  return Q.fcall(
    function () {
      return getInitialPoppinsComment(issue.number);
    })
    .then(function (initialComment) {
      var newCommentParams = getUpdatedVoteParams(initialComment, newVote);
      return [initialComment, newCommentParams];
    })
    .spread(function (initialComment, newCommentParams) {
      var newComment = getUpdatedVoteComment(newCommentParams);
      return [
        editComment(initialComment.id, newComment),
        editLabels(issue, newCommentParams)
      ];
    });
}

/**
 * Build the response body of the main mary-poppins comment.
 *
 * @param commentParams - The updated comment parameters with 'yes' count, 'no' count, 'entropy' value.
 * @returns {Array} of {String} representing the several parts of the created comment body.
 */
function buildResponseBody(commentParams) {
  var body = noVotesYet;
  // if everything is defined
  if (!_.isUndefined(commentParams) && !_.isUndefined(commentParams.yays) && !_.isUndefined(commentParams.nays)) {
    body = _.template(prVote.responseBody, commentParams);
  }
  return [
    prVote.greeting, body, voteInfo, prVote.closing,
    buildYaysTag(commentParams ? commentParams.yays : 0),
    buildNaysTag(commentParams ? commentParams.nays : 0),
    buildNoVoteTag()];
}

/**
 * Builds the yays tag.
 * @param count - {Number} of counted yays.
 * @returns {string} representation of the tag.
 */
function buildYaysTag(count) {
  return yaysTag + (count || 0) + '\n';
}

/**
 * Builds the nays tag.
 * @param count - {Number} of counted nays.
 * @returns {string} representation of the tag.
 */
function buildNaysTag(count) {
  return naysTag + (count || 0) + '\n';
}

/**
 * Builds a tag that will avoid checking the comment for votes.
 * @returns {string} representation of the tag.
 */
function buildNoVoteTag() {
  return noVoteTag + '\n';
}

/**
 * Check if the given payload is pull request related.
 *
 * @param data - The incoming data.
 * @returns {boolean}, true if `data` contains a `pull_request` field.
 */
function isPullRequestComment(data) {
  return data.issue.hasOwnProperty('pull_request');
}

/**
 * Gets a vote from an issue_comment object, as sent by the Webhook.
 *
 * @param data - The issue_comment GitHub object.
 * @returns {number} - +1 if the vote is a 'yes', -1 if it's a 'no',
 * 0 if there's no vote or there are inconsistencies such as multiple votes.
 */
function getVoteFromComment(data) {
  // there are some cases when the vote must not be collected, depending on the `[pr-vote-no]:true` tag
  if (_.contains(data.comment.body, noVoteTag)) {
    return 0;
  }
  var yay = _.contains(data.comment.body, prVote.voteYay) ? 1 : 0;
  var nay = _.contains(data.comment.body, prVote.voteNay) ? -1 : 0;
  // if both yay and nay are present, they void the vote
  return yay + nay;
}

/**
 * Gets the first comment by poppins on the given issue (by number).
 *
 * @param issueNumber - The Issue number that was commented on.
 * @returns An {Object} representing the first comment by mary-poppins.
 */
function getInitialPoppinsComment(issueNumber) {
  var msg = _.defaults({
    number: issueNumber
  }, poppins.config.msg);
  return poppins
    .rest.issues.getComments(msg)
    .then(function (comments) {
      return _.find(comments, {
        'user': {
          'login': poppins.config.login.username
        }
      });
    })
    .then(function (initialComment) {
      // handle the case when the comment is undefined (deleted or not found)
      if (!initialComment) {
        return handleFirstResponse(issueNumber);
      }
      return initialComment;
    })
    .then(function (initialComment) {
      return initialComment;
    });
}

/**
 * Calculates the new vote values.
 *
 * @param firstComment - The old comment to parse.
 * @param vote - The new vote, positive for yays, negative for nays.
 * @returns {Object} of yays, nays and entropy.
 */
function getUpdatedVoteParams(firstComment, vote) {
  var yaysMatch = firstComment.body.match(new RegExp('(?:' + escapeRegExp(yaysTag) + ')([0-9]+)')) || [0,0];
  var naysMatch = firstComment.body.match(new RegExp('(?:' + escapeRegExp(naysTag) + ')([0-9]+)')) || [0,0];
  var yays = parseInt(yaysMatch[1], 10);
  var nays = parseInt(naysMatch[1], 10);
  if (vote > 0) {
    yays += vote;
  } else if (vote < 0) {
    nays -= vote;
  }
  var entropy = Abacus.entropy(yays, nays);
  return {
    yays: yays,
    nays: nays,
    entropy: _.isNumber(entropy) ? entropy.toFixed(4) : 'not available'
  };
}

/**
 * Returns the new body for the mary-poppins comment by incrementing yays or nays counts.
 *
 * @param commentParams - The new comment parameters (yays, nays, entropy).
 * @returns A {String} representing the new mary-poppins comment.
 */
function getUpdatedVoteComment(commentParams) {
  return buildResponseBody(commentParams).join(paragraphsJoin);
}

/**
 * Edits a GitHub comment.
 *
 * @param id - An {Integer} id of the comment.
 * @param body - The comment body as {String}.
 * @returns A {Promise} that will be resolved with the updated comment.
 */
function editComment(id, body) {
  var msg = _.defaults({
    id: id,
    body: body
  }, poppins.config.msg);
  return poppins.rest.issues.editComment(msg);
}

/**
 * Edits labels of an issue.. If a label is defined in the configuration options, they will be added and removed,
 * otherwise their addition/deletion will be ignored.
 *
 * @param issue - The issue {Object} containing the current labels.
 * @param newCommentParams - {Object} containing yays, nays, entropy values.
 */
function editLabels(issue, newCommentParams) {
  var labels = _.pluck(issue.labels, 'name');
  var toBeRemoved = [];

  if (isLowEntropy(newCommentParams.entropy)) {
    maybeAdd(labels, prVote.labelEntropyLow);
    toBeRemoved.push(prVote.labelEntropyHigh);
  } else if (isHighEntropy(newCommentParams.entropy)) {
    maybeAdd(labels, prVote.labelEntropyHigh);
    toBeRemoved.push(prVote.labelEntropyLow);
  } else {
    toBeRemoved.push(prVote.labelEntropyLow);
    toBeRemoved.push(prVote.labelEntropyHigh);
  }

  if (isPercentageGood(newCommentParams.yays, newCommentParams.nays)) {
    maybeAdd(labels, prVote.labelYay);
    toBeRemoved.push(prVote.labelNay);
  } else if (isPercentageGood(newCommentParams.nays, newCommentParams.yays)) {
    maybeAdd(labels, prVote.labelNay);
    toBeRemoved.push(prVote.labelYay);
  } else {
    toBeRemoved.push(prVote.labelYay);
    toBeRemoved.push(prVote.labelNay);
  }

  _.forEach(toBeRemoved, function (r) {
    _.pull(labels, r);
  });

  // edit the labels on the server
  var msg = _.defaults({
    number: issue.number,
    labels: labels
  }, poppins.config.msg);
  return poppins.rest.issues.edit(msg);
}

/**
 * Adds an element to an array if the element is truthy.
 *
 * @param array - {Array} to add the element to.
 * @param what - {Object} to check for truthy value and eventually add.
 * @returns The original {Array} possibly with the new element.
 */
function maybeAdd(array, what) {
  if (what) {
    return array.push(what);
  }
  return array;
}

function isLowEntropy(entropy) {
  return entropy < prVote.thresholdMaxLowEntropy;
}

function isHighEntropy(entropy) {
  return entropy > prVote.thresholdMinHighEntropy;
}

function isPercentageGood(positives, overNegatives) {
  var sum = positives + overNegatives;
  return (sum > 0 && (positives / sum) > prVote.thresholdAcceptableVote);
}

var specials = ["-", "[", "]"];
var regex = new RegExp('[' + specials.join('\\') + ']', 'g');

/**
 * Escapes special characters from tag strings, so they can be used as RegExps.
 * @param str - {string} to escape.
 * @returns Escaped {string} that can be used in a RegExp.
 */
function escapeRegExp(str) {
  return str.replace(regex, "\\$&");
}

/**
 * Generic error handling.
 * @param error - The {Error}.
 */
function commonFail(error) {
  console.error(error.toString());
  throw error;
}