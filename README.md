poppins-pr-vote
===============

[![NPM version][npm-version-image]][npm-url]
[![Apache License][license-image]][license-url]
[![NPM downloads][npm-downloads-image]][npm-url]

[Mary Poppins](https://github.com/btford/mary-poppins "btford/mary-poppins") plugin for keeping track of votes in PRs.

![poppins-pr-vote in action](https://raw.github.com/frapontillo/poppins-pr-vote/master/img/in-action.png)

## Install

`npm install poppins-pr-vote`

![run to mary](https://raw.github.com/frapontillo/poppins-pr-vote/master/img/run-to-mary-poppins.png)


## Configure

To use this plugin, you need to load it in your config file with `couldYouPlease`:

```javascript
// config.js
module.exports = function (poppins) {

  poppins.config = { /*...*/ };

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

By default, Mary Poppins will automatically count votes and respond or edit her first comment with updated counts and entropy. If labels are set, they will be automatically updated.


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