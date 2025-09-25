chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'leetCodeProblemLoaded') {
    chrome.alarms.clear('algoBuddyHintAlarm', () => {
      chrome.storage.local.get(['hintTimerDuration'], (result) => {
        const duration = result.hintTimerDuration;
        if (duration && duration > 0) {
          chrome.alarms.create('algoBuddyHintAlarm', { delayInMinutes: duration });
          console.log(`AlgoBuddy hint alarm set for ${duration} minutes.`);
        }
      });
    });
  } 
  
  else if (request.message === 'getTimerStatus') {
    chrome.alarms.get('algoBuddyHintAlarm', (alarm) => {
      if (alarm) {
        const remainingTime = alarm.scheduledTime - Date.now();
        sendResponse({ remainingTime: remainingTime });
      } else {
        sendResponse({ remainingTime: 0 });
      }
    });
    return true; 
  } 
  
  else if (request.message === 'cancelAlarm') {
    chrome.alarms.clear('algoBuddyHintAlarm', () => {
      console.log('AlgoBuddy alarm cancelled.');
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'algoBuddyHintAlarm') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        chrome.storage.session.set({ triggerHintOnLoad: true }, () => {
          chrome.sidePanel.open({ tabId: tabId });
        });
      }
    });
  }
});