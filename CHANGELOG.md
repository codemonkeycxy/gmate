# GMate Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## 3.0.0
- [maintenance] Set up integration with G Suite Admin SDK to get full room list
- [fix] Mute room booking email notification to reduce noise

## 2.2.1
- [maintenance] Optimize task pruner to reduce network calls

## 2.2.0
- [feature] Support searching room for recurring meetings
- [enhancement] Show a "paused" sign on the icon when the worker is stopped
- [enhancement] Throttle room found messages to avoid overwhelming users
- [maintenance] Log more detailed crash report for analytics
- [maintenance] Migrate room searching queue backup data to local storage for more space
- [maintenance] Move cancelled meeting detection to use Calendar API for better stability

## 2.1.0
- [enhancement] Redesign the room searching button UI for better visibility
- [enhancement] Notify user when a meeting is already having a qualified room
- [maintenance] Deprecate code related with the old style room confirmation mechanism

## 2.0.0
- [enhancement] Add Calendar API auth prompt to "I need a room" button
- [enhancement] Make room confirmation step unnecessary
- [enhancement] Skip room searching for past meetings

## 1.0.1
- [enhancement] Add several more offices into the location filter

## 1.0.0
- [enhancement] Add the NYC office as a supported location filter
- [enhancement] Open up FAQ upon user un-installation

## 0.4.3
- [enhancement] Load GMate welcome page upon initial installation

## 0.4.2
- [enhancement] Automatically retire tasks for deleted events
- [enhancement] Allow user to cancel the current task from the "room-found" notification

## 0.4.1
- [maintenance] Bump minimum Chrome version requirement
- [fix] Fix "no guest invited" from popping up indiscriminately

## 0.4.0
- [feature] Support per-event room filters

## 0.3.3
- [feature] Add post-uninstall user survey
- [maintenance] Deprecate "allow invitee to edit event" feature, which has been natively supported by Google Calendar

## 0.3.2
- [maintenance] Announce the replacement of "allow invitee to edit event" feature with the one that Google Calendar natively supports
- [maintenance] Turn on room booking feature by default
- [fix] Safe guard against null pointer exceptions caused by empty room names

## 0.3.1
- [enhancement] Load up more rooms to ensure better room booking results
- [enhancement] Reduce simulated tab clicks to avoid user confusion
- [maintenance] Switch ugly callbacks to cleaner async/await style (bumped min Chrome version to 56)

## 0.3.0
- [feature] Add user-friendly room booking filters

## 0.2.4
- [enhancement] Refresh calendar page on app update to ensure the delivery of the newest code
- [enhancement] Refresh calendar page on room saving to ensure the saved room to show up

## 0.2.3
- [feature] Add bug report link
- [enhancement] Integrate with Mixpanel for user action analytics

## 0.2.2.0
- [announcement] Apologize for the room searching feature outage

## 0.2.1.0
- [feature] Advertise new features to users upon new version release
- [fix] Properly recycle room searching tasks to avoid confusing task display in settings panel
- [fix] Fix room book not working bug

## 0.2.0.0
- [feature] Preserve the task queue and reload upon chrome window reopen
- [feature] Allow start/stop room searching worker from settings panel
- [feature] Allow removing tasks from settings panel
- [fix] Avoid auto booking if there's already a booked room that matches the searching criteria
- [enhancement] Show a warning banner on the worker tab to warn users from interruption
- [enhancement] Change "I need a room" button color to call for attention
- [enhancement] Trigger notification after "I need a room" button is clicked
- [enhancement] Show room searching worker status on the settings panel

## 0.1.0.1
- [fix] Fix the race condition between different events that compete for the room searching worker

## 0.1.0.0
- [feature] Search room for user registered meetings on the background

## 0.0.3.3

- [fix] Avoid double trigger events upon meeting edit page exit

## 0.0.3.2

- [fix] Always switch back to "guest" tab even if no room is available
- [maintenance] Styling improvements such as es6, code prettify, etc.

## 0.0.3.1

- [fix] Stop treating event organizer and booked rooms as invitees

## 0.0.3.0

- [feature] Room selection regex filters

## 0.0.2.x

- [feature] Automatically allow invitees to edit event
- [feature] Remind if no invitee is selected
- [feature] Automatically add a zoom link to each meeting
- [feature] Automatically select a room for the meeting