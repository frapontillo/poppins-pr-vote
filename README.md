poppins-pr-vote
===============

[![NPM version][npm-version-image]][npm-url]
[![Apache License][license-image]][license-url]
[![NPM downloads][npm-downloads-image]][npm-url]

[Mary Poppins](https://github.com/btford/mary-poppins "btford/mary-poppins") plugin for keeping track of votes in PRs.

![poppins-pr-vote in action](https://raw.github.com/frapontillo/poppins-pr-vote/master/img/in-action.png)

When Mary Poppins is started on a repository with `poppins-pr-vote` as a properly configured plugin, it will automatically:

* add a post as soon as a PR is submitted on that repo (see upper image)
* listen for issue **and** diff comments on that PR and any commit in it
* look for strings that represent positive or negative votes
* update the first post with an updated "**yes**" and "**no**" counts, enriched with an **entropy** measure
* optionally update the PR by assigning **labels** (see the [Configure section](#configure)) according to both votes and entropy

Of course, "yes" and "no" measures represent the number of positive and negative votes, while the [**entropy**](http://en.wikipedia.org/wiki/Entropy_%28information_theory%29#Rationale) gives you a compact idea of how "messy" the PR is if related to people's votes: 

![Entropy for dummies LOL](http://upload.wikimedia.org/math/3/2/8/328a1ee1f0db87e7c6aefa87efcac491.png)


## Prerequisites (aka Get Poppin')

You need a [Mary Poppins](https://github.com/btford/mary-poppins "btford/mary-poppins") instance already configured on your repository.
We will quickly cover the main aspect of the initial setup, for further information please refer to the official [README](https://github.com/btford/mary-poppins/blob/master/README.md).

Install `mary-poppins` as a global `npm` package:

```shell
npm install -g mary-poppins
```

Then, create a basic `config.js` file in any directory you like by running:

```shell
mary-poppins init
```

At this point, you need to configure the config file that was just created by editing the appropriate attributes of the `poppins.config` object, e.g.:

```javascript
poppins.config = {
  // Github repo to watch
  // https://github.com/target-organization/target-repo
  target: {
    user: 'target-organization',
    repo: 'target-repo'
  },

  // Credentials for user who leaves comments, etc.
  // You may want to load these from a seperate file like `config-credentials.js`, and
  // add this file to your `.gitignore` list
  login: {
    username: 'awesome-bot',
    password: 'password123ofcourse'
  },

  // GitHub will send WebHooks events here
  hook: {
    url: 'http://my-mary-poppins-url.com',
    port: '4567'
  }
}

```

Mary Poppins is now able to automatically install the WebHook by running:

```shell
mary-poppins install config.js
```


## Install

In the same directory of your `config.js` file, run:

```shell
npm install poppins-pr-vote`
```

![run to mary oh sweet mary](https://raw.github.com/frapontillo/poppins-pr-vote/master/img/run-to-mary-poppins.png)


## Configure

Before setting up the plugin, you need to edit the Webhook previously created by `mary-poppins` by enabling the `pull_request_review_comment`, named "Pull Request review comment - Pull Request diff commented on".

To use this plugin, you need to load it in your config file with `couldYouPlease`:

```javascript
// config.js
module.exports = function (poppins) {
  
  // we already took care of this
  poppins.config = { /*...*/ };

  // load the pr-vote plugin
  poppins.couldYouPlease('pr-vote');

  // pr vote main settings
  poppins.plugins.prVote.greeting = 'Thanks for the PR!';
  poppins.plugins.prVote.responseBody: 'Yays: <%= yays %>\nNays: <%= nays %>\nEntropy: <%= entropy %>';
  poppins.plugins.prVote.closing = 'Farewell.';

  // pr vote configuration
  poppins.plugins.prVote.voteYay = ':+1:';
  poppins.plugins.prVote.VoteNay = ':x:';

  // pr vote labels
  poppins.plugins.prVote.labelEntropyLow: 'pr:nice';
  poppins.plugins.prVote.labelEntropyHigh: 'pr:mess';
  poppins.plugins.prVote.labelYay: 'pr:yay';
  poppins.plugins.prVote.labelNay: 'pr:nay';

  // pr vote thresholds
  poppins.plugins.prVote.thresholdMaxLowEntropy: 0.45;
  poppins.plugins.prVote.thresholdMinHighEntropy: 0.65;
  poppins.plugins.prVote.thresholdAcceptableVote: 0.65;
};
```

By default, Mary Poppins will automatically count votes and respond or edit her (its?) first comment with updated counts and entropy. If labels are set, they will be automatically updated.

The following is the complete list of every configuration you might want to set.


### `poppins.plugins.prVote.greeting`

String to start the response with.
Defaults to `"Thanks for the PR!"`.


### `poppins.plugins.prVote.closing`

String to start the response with.
Defaults to `"Farewell."`.


### `poppins.plugins.prVote.responseBody`

String to be interpolated with `yays`, `nays` and `entropy` values.
Defaults to `"Yays: <%= yays %>\nNays: <%= nays %>\nEntropy: <%= entropy %>"`.


### `poppins.plugins.prVote.voteYay`

String that will be matched for a positive vote.
Defaults to `":+1:"`.


### `poppins.plugins.prVote.VoteNay`

String that will be matched for a negative vote.
Defaults to `":x:"`.


### `poppins.plugins.prVote.labelEntropyLow`

Label added to a PR if the votes entropy is lower than [`poppins.plugins.prVote.thresholdMaxLowEntropy`](#poppinspluginsprvotethresholdmaxlowentropy).
Defaults to `"pr:nice"`. Optional, if `undefined`, such label won't be added/removed.


### `poppins.plugins.prVote.labelEntropyHigh`

Label added to a PR if the votes entropy is higher than [`poppins.plugins.prVote.thresholdMinHighEntropy`](#poppinspluginsprvotethresholdminhighentropy).
Defaults to `"pr:mess"`. Optional, if `undefined`, such label won't be added/removed.


### `poppins.plugins.prVote.labelYay`

Label added to a PR if the voting proportion outcome is positive (higher than [`poppins.plugins.prVote.thresholdAcceptableVote`](#poppinspluginsprvotethresholdacceptablevote)).
Defaults to `"pr:yay"`. Optional, if `undefined`, such label won't be added/removed.


### `poppins.plugins.prVote.labelNay`

Label added to a PR if the voting outcome is negative (lower than [`poppins.plugins.prVote.thresholdAcceptableVote`](#poppinspluginsprvotethresholdacceptablevote)).
Defaults to `"pr:nay"`. Optional, if `undefined`, such label won't be added/removed.


### `poppins.plugins.prVote.thresholdMaxLowEntropy`

Maximum entropy value for a "good" PR.
Defaults to `0.45`.


### `poppins.plugins.prVote.thresholdMinHighEntropy`

Minimum entropy value for a "bad" PR.
Defaults to `0.65`.


### `poppins.plugins.prVote.thresholdAcceptableVote`

Minimum positive votes rate for a "positive" PR.
Defaults to `0.65`.


## Start!

All you need to do now is to start `mary-poppins` by pointing at the `config.js`:

```shell
mary-poppins start config.js
```


# License

```
   Copyright 2014 Francesco Pontillo

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

[license-image]: http://img.shields.io/badge/license-Apache_2.0-blue.svg?style=flat
[license-url]: LICENSE

[npm-url]: https://npmjs.org/package/poppins-pr-vote
[npm-version-image]: http://img.shields.io/npm/v/poppins-pr-vote.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/hpoppins-pr-vote.svg?style=flat