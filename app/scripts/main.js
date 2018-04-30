/*
*
*  Push Notifications codelab
*  Copyright 2015 Google Inc. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License
*
*/

/* eslint-env browser, es6 */

'use strict';

const applicationServerPublicKey = 'BCIJlJDMO8u8zZ-E8iBb_oK1N3rgyyEOm-kZow7QxZE9-CKU1cVju6iYVCPQRAvVEUczpwUrfCibOuaAnlC4Y7o';

const pushButton = document.querySelector('.js-push-btn');

let isSubscribed = false;
let swRegistration = null;

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 현재 브라우저에서 서비스 워커와 푸시 메시지를 지원하는지 확인하고
// 지원한다면 sw.js 파일을 등록
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported');

  navigator.serviceWorker.register('sw.js')
  .then(function(swReg) {
    console.log('Service Worker is registered', swReg);

    swRegistration = swReg;
  })
  .catch(function(error) {
    console.error('Service Worker Error', error);
  });
} else {
  console.warn('Push messaging is not supported');
  pushButton.textContent = 'Push Not Supported';
}

// 사용자가 현재 구독한 상태인지 확인 
function initialiseUI() {
  pushButton.addEventListener('click', function() {
    // 사용자가 푸시 버튼을 클릭할 때 푸시를 구독하는 데 시간이 좀 걸릴 수 있으므로 
    // 먼저 버튼을 비활성화하여 구독하는 동안 사용자가 버튼을 다시 클릭할 수 없도록 함
    pushButton.disabled = true;
    if (isSubscribed) {
      // TODO: Unsubscribe user
    } else {
      subscribeUser(); // 사용자가 현재 구독하지 않은 상태임을 알 때 subscribeUser()를 호출
    }
  });

  // Set the initial subscription value
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    isSubscribed = !(subscription === null);

    if (isSubscribed) {
      console.log('User IS subscribed.');
    } else {
      console.log('User is NOT subscribed.');
    }

    updateBtn();
  });
}

// 사용자가 구독한 상태인지 여부에 따라 버튼을 활성화하고 텍스트를 변경
function updateBtn() {
  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }

  pushButton.disabled = false;
}

// 서비스 워커가 등록될 때 initialiseUI()를 호출
navigator.serviceWorker.register('sw.js')
.then(function(swReg) {
  console.log('Service Worker is registered', swReg);

  swRegistration = swReg;
  initialiseUI();
})

// 구독하기
function subscribeUser() {
  // 구독 호출의 예상 입력을 알아내기 위해 
  // 기본 64 URL 안전 인코딩된 애플리케이션 서버의 공개 키를 취하여 UInt8Array로 변환
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);

  swRegistration.pushManager.subscribe({
    userVisibleOnly: true, // userVisibleOnly 매개변수는 기본적으로 푸시가 전송될 때마다 알림을 표시하도록 허용
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed:', subscription);

    updateSubscriptionOnServer(subscription);

    isSubscribed = true;

    updateBtn();
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
    updateBtn(); // 버튼이 다시 활성화되고 알맞은 텍스트가 있는지 확인
  });
}

// 실제 애플리케이션에서 백엔드로 구독을 보내는 메서드
// 여기서는 나중에 도움이 되도록 UI에 구독을 출력
function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server

  const subscriptionJson = document.querySelector('.js-subscription-json');
  const subscriptionDetails =
    document.querySelector('.js-subscription-details');

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    subscriptionDetails.classList.remove('is-invisible');
  } else {
    subscriptionDetails.classList.add('is-invisible');
  }
}

/* 거부된 권한 처리 */
function updateBtn() {
  if (Notification.permission === 'denied') { // 사용자가 알림 권한을 차단한 경우
    pushButton.textContent = 'Push Messaging Blocked.';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }

  pushButton.disabled = false;
}