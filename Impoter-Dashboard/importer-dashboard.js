/* Importer Dashboard Controller */
(function () {
    'use strict';

    const importerFirebaseConfig = {
        apiKey: "AIzaSyAR-xJ3WZsw8m9ZE97hDRiHFaU0Uilq9Lw",
        authDomain: "impoter-9e6bf.firebaseapp.com",
        databaseURL: "https://impoter-9e6bf-default-rtdb.firebaseio.com",
        projectId: "impoter-9e6bf",
        storageBucket: "impoter-9e6bf.firebasestorage.app",
        messagingSenderId: "663462993062",
        appId: "1:663462993062:web:be35a602082d488315e867",
        measurementId: "G-7ZHY799QTS"
    };

    const statusClassMap = {
        'In Transit': 'status-in-transit',
        'Arrived at Port': 'status-arrived',
        'Under Customs Check': 'status-customs',
        'Cleared': 'status-cleared',
        'Out for Delivery': 'status-out-for-delivery',
        'Delivered': 'status-delivered'
    };

    const defaultFaqs = [
        'How to download documents?',
        'How to track shipment?',
        'How to make payment?',
        'What to do in case of delay?',
        'How disputes work?'
    ];

    const defaultDocumentTypes = [
        'Commercial Invoice',
        'Packing List',
        'Bill of Lading / Airway Bill',
        'Insurance Certificate',
        'Customs Declaration',
        'Compliance Documents'
    ];

    let importerApp = null;
    let importerAuth = null;
    let importerDatabase = null;
    let currentUser = null;
    let currentUserBasePath = '';
    const realtimeBindings = [];

    function initFirebase() {
        try {
            const existing = firebase.apps.find(app => app.name === 'importerApp');
            importerApp = existing || firebase.initializeApp(importerFirebaseConfig, 'importerApp');
            importerAuth = importerApp.auth();
            importerDatabase = importerApp.database();
        } catch (error) {
            console.warn('Failed to bootstrap importer Firebase app:', error);
        }
    }

    const sectionTitleMap = {
        dashboard: 'Dashboard',
        shipments: 'Shipments',
        documents: 'Documents',
        payments: 'Payments',
        verification: 'Verification',
        disputes: 'Disputes',
        support: 'Support',
        orders: 'Orders',
        notifications: 'Notifications',
        profile: 'Profile & Settings'
    };

    function activateSection(target) {
        document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
            const isActive = link.dataset.tab === target;
            link.classList.toggle('active', isActive);
        });
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === `${target}Section`);
        });
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = sectionTitleMap[target] || 'Dashboard';
        }
    }

    function showToast(message) {
        const toast = document.getElementById('importerToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3200);
    }

    function setStatusBadge(text, intent = 'info') {
        const badge = document.getElementById('importerStatusBadge');
        if (!badge) return;
        const intentColors = {
            info: { bg: '#e0f2fe', color: '#075985' },
            success: { bg: '#dcfce7', color: '#166534' },
            warning: { bg: '#fef9c3', color: '#92400e' },
            danger: { bg: '#fee2e2', color: '#991b1b' }
        };
        badge.textContent = text;
        const palette = intentColors[intent] || intentColors.info;
        badge.style.background = palette.bg;
        badge.style.color = palette.color;
    }

    function convertToArray(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data.filter(Boolean);
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    function clearRealtimeBindings() {
        realtimeBindings.forEach(binding => {
            binding.ref.off('value', binding.listener);
        });
        realtimeBindings.length = 0;
    }

    function bindRealtime(path, handler) {
        if (!importerDatabase) return;
        const ref = importerDatabase.ref(path);
        const listener = snapshot => handler(snapshot.val());
        ref.on('value', listener);
        realtimeBindings.push({ ref, listener });
    }

    function emptyState(message) {
        return `<div class="empty-state">${message}</div>`;
    }

    function renderSummaryCards(data = {}) {
        document.getElementById('summaryActiveShipments').textContent = data.activeShipments ?? 0;
        document.getElementById('summaryPendingPayments').textContent = data.pendingPayments ?? 0;
        document.getElementById('summaryPendingVerification').textContent = data.pendingVerification ?? 0;
        document.getElementById('summaryDeliveredShipments').textContent = data.deliveredShipments ?? 0;
    }

    function renderShipments(data) {
        const container = document.getElementById('shipmentsList');
        if (!container) return;
        container.innerHTML = '';
        const shipments = convertToArray(data);
        if (!shipments.length) {
            container.innerHTML = emptyState('No shipments have been synced yet.');
            return;
        }

        shipments.forEach(item => {
            const statusClass = statusClassMap[item.status] || 'status-in-transit';
            const card = document.createElement('article');
            card.className = 'shipment-card';
            card.innerHTML = `
                <h4>${item.shipmentId || 'Shipment'}</h4>
                <div class="shipment-meta">
                    <span>Exporter: ${item.exporterName || '—'}</span>
                    <span>Origin: ${item.originCountry || '—'}</span>
                    <span>ETA: ${item.eta || '—'}</span>
                </div>
                <span class="shipment-status ${statusClass}">${item.status || 'In Transit'}</span>
                ${item.qrUrl ? `<img src="${item.qrUrl}" alt="Shipment QR" width="120" height="120" loading="lazy">` : ''}
            `;
            container.appendChild(card);
        });
    }

    function renderDocumentsSection(data = {}) {
        const list = document.getElementById('documentsList');
        if (!list) return;
        list.innerHTML = '';

        const viewBtn = document.getElementById('documentsViewBtn');
        const downloadBtn = document.getElementById('documentsDownloadBtn');
        if (viewBtn) viewBtn.dataset.url = data.viewUrl || '';
        if (downloadBtn) downloadBtn.dataset.url = data.downloadUrl || '';

        const documents = convertToArray(data.files);
        const template = documents.length ? documents : defaultDocumentTypes.map(type => ({ type, status: 'Waiting for upload' }));

        template.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'document-card';
            card.innerHTML = `
                <p><strong>${doc.type || doc.name}</strong></p>
                <small>${doc.status || 'Available online'}</small><br>
                ${doc.updatedAt ? `<small>Updated: ${formatDate(doc.updatedAt)}</small>` : ''}
            `;
            list.appendChild(card);
        });
    }

    function renderPaymentPanel(data = {}) {
        const liveRateEl = document.getElementById('paymentLiveRate');
        if (liveRateEl) {
            liveRateEl.textContent = data.liveRate ? `${data.liveRate.value} ${data.liveRate.pair || ''}` : '--';
        }

        const feeBreakdown = document.getElementById('paymentFeeBreakdown');
        if (feeBreakdown) {
            feeBreakdown.innerHTML = '';
            const fees = convertToArray(data.feeBreakdown);
            if (!fees.length) {
                feeBreakdown.innerHTML = '<span>No fee details yet.</span>';
            } else {
                fees.forEach(fee => {
                    const row = document.createElement('div');
                    row.textContent = `${fee.label || 'Fee'}: ${fee.amount || '--'}`;
                    feeBreakdown.appendChild(row);
                });
            }
        }

        const historyList = document.getElementById('paymentHistoryList');
        if (historyList) {
            historyList.innerHTML = '';
            const history = convertToArray(data.history);
            if (!history.length) {
                historyList.innerHTML = emptyState('No payments recorded yet.');
            } else {
                history.forEach(entry => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.innerHTML = `
                        <strong>${entry.amount || '--'} ${entry.currency || ''}</strong>
                        <div>${entry.notes || '—'}</div>
                        <small>${formatDate(entry.createdAt)}</small>
                    `;
                    historyList.appendChild(item);
                });
            }
        }
    }

    function renderVerificationStatus(data = {}) {
        const badge = document.getElementById('verificationStatusBadge');
        const copy = document.getElementById('verificationStatusCopy');
        const status = data.status || 'Verification Pending';
        if (badge) {
            badge.textContent = status;
            const intent = status.includes('Pending') ? 'warning' : status.includes('Verified') ? 'success' : 'info';
            badge.className = `tag ${intent}`;
        }
        if (copy) {
            copy.textContent = data.description || 'Status updates will appear here.';
        }
    }

    function renderDisputeHistory(data = {}) {
        const list = document.getElementById('disputeHistoryList');
        if (!list) return;
        list.innerHTML = '';
        const disputes = convertToArray(data.history);
        if (!disputes.length) {
            list.innerHTML = emptyState('No disputes raised yet.');
            return;
        }
        disputes.forEach(dispute => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <strong>${dispute.type}</strong>
                <div>${dispute.description || ''}</div>
                <small>${formatDate(dispute.createdAt)} • ${dispute.status || 'Open'}</small>
            `;
            list.appendChild(item);
        });
    }

    function renderSupportModule(data = {}) {
        const chatLog = document.getElementById('supportChatLog');
        const faqList = document.getElementById('supportFaqList');

        if (chatLog) {
            chatLog.innerHTML = '';
            const messages = convertToArray(data.messages).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            if (!messages.length) {
                chatLog.innerHTML = emptyState('Chat history will appear here.');
            } else {
                messages.forEach(msg => {
                    const entry = document.createElement('div');
                    entry.className = 'chat-entry';
                    entry.innerHTML = `
                        <strong>${msg.author || 'Support Bot'}</strong>
                        <p>${msg.message || ''}</p>
                        <small>${formatDate(msg.createdAt)}</small>
                    `;
                    chatLog.appendChild(entry);
                });
                chatLog.scrollTop = chatLog.scrollHeight;
            }
        }

        if (faqList) {
            faqList.innerHTML = '';
            const faqs = convertToArray(data.faqs);
            const topics = faqs.length ? faqs.map(item => item.title || item.question) : defaultFaqs;
            topics.forEach(topic => {
                const li = document.createElement('li');
                li.textContent = topic;
                faqList.appendChild(li);
            });
        }
    }

    function renderOrders(data = {}) {
        const list = document.getElementById('ordersList');
        if (!list) return;
        list.innerHTML = '';
        const orders = convertToArray(data.items);
        if (!orders.length) {
            list.innerHTML = emptyState('No completed imports yet.');
            return;
        }
        orders.forEach(order => {
            const card = document.createElement('article');
            card.className = 'order-card';
            card.innerHTML = `
                <strong>${order.orderId || 'Order'}</strong>
                <p>Delivered: ${order.deliveryDate || '—'}</p>
                <p>Total Cost: ${order.total || '—'}</p>
                <small>Documents • Invoice • Chat • Receipts</small>
            `;
            list.appendChild(card);
        });
    }

    function renderNotifications(data = {}) {
        const list = document.getElementById('notificationsList');
        if (!list) return;
        list.innerHTML = '';
        const notifications = convertToArray(data.items);
        if (!notifications.length) {
            list.innerHTML = emptyState('You are all caught up.');
            return;
        }
        notifications
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .forEach(notification => {
                const item = document.createElement('div');
                item.className = 'notification-item';
                item.innerHTML = `
                    <strong>${notification.title || 'Update'}</strong>
                    <p>${notification.message || ''}</p>
                    <small>${formatDate(notification.createdAt)}</small>
                `;
                list.appendChild(item);
            });
    }

    function renderProfileSection(data = {}) {
        const businessDl = document.getElementById('profileBusinessDetails');
        const addressesUl = document.getElementById('profileAddresses');
        const preferencesDl = document.getElementById('profilePreferences');
        const paymentUl = document.getElementById('profilePaymentMethods');

        if (businessDl) {
            businessDl.innerHTML = '';
            const entries = {
                'Company Name': data.companyName,
                'Registration / IEC': data.registrationId,
                'Primary Contact': data.contactPerson,
                'Email': data.email,
                'Phone': data.phone
            };
            Object.entries(entries).forEach(([label, value]) => {
                const dt = document.createElement('dt');
                const dd = document.createElement('dd');
                dt.textContent = label;
                dd.textContent = value || '—';
                businessDl.append(dt, dd);
            });
        }

        if (addressesUl) {
            addressesUl.innerHTML = '';
            const addresses = data.addresses || [];
            if (!addresses.length) {
                addressesUl.innerHTML = '<li>No saved addresses yet.</li>';
            } else {
                addresses.forEach(address => {
                    const li = document.createElement('li');
                    li.textContent = address;
                    addressesUl.appendChild(li);
                });
            }
        }

        if (preferencesDl) {
            preferencesDl.innerHTML = '';
            const preferences = {
                'Preferred Language': data.language,
                'Default Currency': data.currency,
                'Notifications': data.notificationsEnabled ? 'Enabled' : 'Disabled'
            };
            Object.entries(preferences).forEach(([label, value]) => {
                const dt = document.createElement('dt');
                const dd = document.createElement('dd');
                dt.textContent = label;
                dd.textContent = value || '—';
                preferencesDl.append(dt, dd);
            });
        }

        if (paymentUl) {
            paymentUl.innerHTML = '';
            const methods = data.paymentMethods || [];
            if (!methods.length) {
                paymentUl.innerHTML = '<li>No payment methods saved.</li>';
            } else {
                methods.forEach(method => {
                    const li = document.createElement('li');
                    li.textContent = method;
                    paymentUl.appendChild(li);
                });
            }
        }
    }

    function handlePaymentSubmit(event) {
        event.preventDefault();
        if (!currentUser || !importerDatabase) {
            showToast('Not connected to Firebase.');
            return;
        }
        const form = event.target;
        const amount = parseFloat(form.amount.value);
        const currency = form.currency.value;
        const notes = form.notes.value.trim();
        if (!amount) {
            showToast('Enter a valid amount.');
            return;
        }
        const payload = {
            amount,
            currency,
            notes,
            createdAt: Date.now(),
            status: 'Pending'
        };
        importerDatabase.ref(`${currentUserBasePath}/payments/requests`).push(payload)
            .then(() => {
                form.reset();
                showToast('Payment request stored.');
            })
            .catch(() => showToast('Failed to store payment request.'));
    }

    function handleDisputeSubmit(event) {
        event.preventDefault();
        if (!currentUser || !importerDatabase) {
            showToast('Not connected to Firebase.');
            return;
        }
        const form = event.target;
        const payload = {
            type: form.type.value,
            description: form.description.value,
            status: 'Open',
            createdAt: Date.now()
        };
        importerDatabase.ref(`${currentUserBasePath}/disputes/history`).push(payload)
            .then(() => {
                form.reset();
                showToast('Dispute submitted.');
            })
            .catch(() => showToast('Failed to submit dispute.'));
    }

    function handleSupportMessageSubmit(event) {
        event.preventDefault();
        if (!currentUser || !importerDatabase) {
            showToast('Not connected to Firebase.');
            return;
        }
        const form = event.target;
        const message = form.message.value.trim();
        if (!message) {
            showToast('Enter a message first.');
            return;
        }
        const payload = {
            message,
            author: currentUser.displayName || currentUser.email || 'Importer',
            createdAt: Date.now()
        };
        importerDatabase.ref(`${currentUserBasePath}/support/messages`).push(payload)
            .then(() => {
                form.reset();
                showToast('Message sent to support.');
            })
            .catch(() => showToast('Failed to send message.'));
    }

    function handleDocumentAction(event) {
        const url = event.currentTarget.dataset.url;
        if (!url) {
            showToast('Document link not available yet.');
            return;
        }
        window.open(url, '_blank', 'noopener');
    }

    function attachEvents() {
        document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                activateSection(link.dataset.tab);
            });
        });

        document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);
        document.getElementById('disputeForm')?.addEventListener('submit', handleDisputeSubmit);
        document.getElementById('supportMessageForm')?.addEventListener('submit', handleSupportMessageSubmit);
        document.getElementById('documentsViewBtn')?.addEventListener('click', handleDocumentAction);
        document.getElementById('documentsDownloadBtn')?.addEventListener('click', handleDocumentAction);

        document.getElementById('refreshImporterData')?.addEventListener('click', () => {
            setStatusBadge('Syncing…', 'info');
            showToast('Listening for realtime updates.');
        });

        document.getElementById('importerLogoutBtn')?.addEventListener('click', async () => {
            if (!importerAuth) {
                window.location.href = '../index.html';
                return;
            }
            clearRealtimeBindings();
            await importerAuth.signOut();
            window.location.href = '../index.html';
        });

        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const toggleSidebar = () => sidebar?.classList.toggle('open');
        sidebarToggle?.addEventListener('click', toggleSidebar);
        mobileMenuToggle?.addEventListener('click', toggleSidebar);
    }

    function startRealtimeSync(uid) {
        if (!importerDatabase) return;
        currentUserBasePath = `importers/${uid}`;
        clearRealtimeBindings();
        bindRealtime(`${currentUserBasePath}/summary`, renderSummaryCards);
        bindRealtime(`${currentUserBasePath}/shipments`, renderShipments);
        bindRealtime(`${currentUserBasePath}/documents`, renderDocumentsSection);
        bindRealtime(`${currentUserBasePath}/payments`, renderPaymentPanel);
        bindRealtime(`${currentUserBasePath}/verification`, renderVerificationStatus);
        bindRealtime(`${currentUserBasePath}/disputes`, renderDisputeHistory);
        bindRealtime(`${currentUserBasePath}/support`, renderSupportModule);
        bindRealtime(`${currentUserBasePath}/orders`, renderOrders);
        bindRealtime(`${currentUserBasePath}/notifications`, renderNotifications);
        bindRealtime(`${currentUserBasePath}/profile`, renderProfileSection);
        setStatusBadge('Synced', 'success');
    }

    function initAuthListener() {
        if (!importerAuth) {
            showToast('Firebase auth not available.');
            return;
        }
        importerAuth.onAuthStateChanged(user => {
            if (!user) {
                clearRealtimeBindings();
                window.location.href = '../index.html';
                return;
            }
            currentUser = user;
            const usernameEl = document.getElementById('importerUserName');
            if (usernameEl) {
                usernameEl.textContent = user.displayName || user.email || 'Importer Workspace';
            }
            startRealtimeSync(user.uid);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initFirebase();
        activateSection('dashboard');
        attachEvents();
        initAuthListener();
    });
})();

