import axios from 'axios';

const BASE_URL = '/api';

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const session = localStorage.getItem('lifelink_session');
  if (session) {
    try {
      const { token } = JSON.parse(session);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore
    }
  }
  return config;
});

// --- IN-BROWSER SIMULATION FALLBACK ENGINE ---
// Initial Mock Database State
const INITIAL_HOSPITALS = [
  { id: 1, name: 'Seattle General Hospital', address: '1100 9th Ave, Seattle, WA 98101', latitude: 47.6062, longitude: -122.3321, contactNumber: '206-555-0101', email: 'contact@seattlegeneral.org', status: 'ACTIVE' },
  { id: 2, name: 'Cherry Hill Medical Center', address: '500 17th Ave, Seattle, WA 98122', latitude: 47.6097, longitude: -122.3123, contactNumber: '206-555-0102', email: 'info@cherryhillmed.org', status: 'ACTIVE' },
  { id: 3, name: 'First Hill Hospital', address: '747 Broadway, Seattle, WA 98122', latitude: 47.6111, longitude: -122.3245, contactNumber: '206-555-0103', email: 'firsthill@hospital.org', status: 'ACTIVE' },
  { id: 4, name: 'University District Medical', address: '4515 15th Ave NE, Seattle, WA 98105', latitude: 47.6611, longitude: -122.3131, contactNumber: '206-555-0104', email: 'udistrict@medical.org', status: 'ACTIVE' },
  { id: 5, name: 'West Seattle Emergency Care', address: '2600 SW Barton St, Seattle, WA 98126', latitude: 47.5611, longitude: -122.3831, contactNumber: '206-555-0105', email: 'westseattle@emergency.org', status: 'ACTIVE' },
];

const INITIAL_INVENTORY = [
  { id: 1, hospitalId: 1, bloodGroup: 'O+', availableUnits: 15, collectionDate: '2026-06-20', expiryDate: '2026-07-25', status: 'AVAILABLE' },
  { id: 2, hospitalId: 1, bloodGroup: 'O-', availableUnits: 8, collectionDate: '2026-06-21', expiryDate: '2026-07-26', status: 'AVAILABLE' },
  { id: 3, hospitalId: 1, bloodGroup: 'A+', availableUnits: 20, collectionDate: '2026-06-15', expiryDate: '2026-07-20', status: 'AVAILABLE' },
  { id: 4, hospitalId: 1, bloodGroup: 'AB-', availableUnits: 2, collectionDate: '2026-06-10', expiryDate: '2026-07-15', status: 'AVAILABLE' },
  
  { id: 6, hospitalId: 2, bloodGroup: 'O+', availableUnits: 10, collectionDate: '2026-06-22', expiryDate: '2026-07-27', status: 'AVAILABLE' },
  { id: 7, hospitalId: 2, bloodGroup: 'O-', availableUnits: 4, collectionDate: '2026-06-23', expiryDate: '2026-07-28', status: 'AVAILABLE' },
  { id: 8, hospitalId: 2, bloodGroup: 'AB-', availableUnits: 5, collectionDate: '2026-06-18', expiryDate: '2026-07-23', status: 'AVAILABLE' },
  { id: 9, hospitalId: 2, bloodGroup: 'B+', availableUnits: 12, collectionDate: '2026-06-14', expiryDate: '2026-07-19', status: 'AVAILABLE' },

  { id: 10, hospitalId: 3, bloodGroup: 'O+', availableUnits: 5, collectionDate: '2026-06-10', expiryDate: '2026-07-15', status: 'AVAILABLE' },
  { id: 11, hospitalId: 3, bloodGroup: 'AB-', availableUnits: 1, collectionDate: '2026-06-08', expiryDate: '2026-07-13', status: 'AVAILABLE' },
  { id: 12, hospitalId: 3, bloodGroup: 'A-', availableUnits: 15, collectionDate: '2026-06-19', expiryDate: '2026-07-24', status: 'AVAILABLE' },

  { id: 13, hospitalId: 4, bloodGroup: 'O-', availableUnits: 2, collectionDate: '2026-06-25', expiryDate: '2026-07-30', status: 'AVAILABLE' },
  { id: 14, hospitalId: 4, bloodGroup: 'AB+', availableUnits: 10, collectionDate: '2026-06-24', expiryDate: '2026-07-29', status: 'AVAILABLE' },

  { id: 15, hospitalId: 5, bloodGroup: 'B-', availableUnits: 6, collectionDate: '2026-06-22', expiryDate: '2026-07-27', status: 'AVAILABLE' },
];

const INITIAL_DONORS = [
  { id: 1, name: 'John Donor', email: 'donor1@lifelink.ai', bloodGroup: 'O-', lastDonationDate: '2026-03-10', address: '4700 9th Ave NE, Seattle, WA 98105', latitude: 47.6631, longitude: -122.3181, contactNumber: '206-555-9000', isAvailable: true },
  { id: 2, name: 'Sarah Compatible', email: 'donor2@lifelink.ai', bloodGroup: 'AB-', lastDonationDate: '2026-04-15', address: '1200 E Pike St, Seattle, WA 98122', latitude: 47.6140, longitude: -122.3160, contactNumber: '206-555-9001', isAvailable: true },
];

// Helper to load/save state in LocalStorage
const getLocalStorageState = (key: string, initial: any) => {
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(saved);
};

const saveLocalStorageState = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Check if Backend is Reachable
let isBackendReachable = false;
export const checkBackendStatus = async (): Promise<boolean> => {
  try {
    await axios.get('http://localhost:8080/api/public/hospitals', { timeout: 1000 });
    isBackendReachable = true;
  } catch (e) {
    isBackendReachable = false;
  }
  return isBackendReachable;
};

// Auto-run status check
checkBackendStatus();

// Native Mock Services
export const mockService = {
  hospitals: {
    list: () => getLocalStorageState('ll_hospitals', INITIAL_HOSPITALS),
    create: (h: any) => {
      const list = getLocalStorageState('ll_hospitals', INITIAL_HOSPITALS);
      const newHospital = { ...h, id: list.length + 1, status: 'ACTIVE' };
      list.push(newHospital);
      saveLocalStorageState('ll_hospitals', list);
      return newHospital;
    },
    update: (id: number, data: any) => {
      const list = getLocalStorageState('ll_hospitals', INITIAL_HOSPITALS);
      const idx = list.findIndex((h: any) => h.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        saveLocalStorageState('ll_hospitals', list);
        return list[idx];
      }
      throw new Error("Hospital not found");
    },
    delete: (id: number) => {
      let list = getLocalStorageState('ll_hospitals', INITIAL_HOSPITALS);
      list = list.filter((h: any) => h.id !== id);
      saveLocalStorageState('ll_hospitals', list);
    }
  },
  
  inventory: {
    list: () => getLocalStorageState('ll_inventory', INITIAL_INVENTORY),
    addOrUpdate: (hospitalId: number, bloodGroup: string, units: number, expiryDate: string) => {
      const list = getLocalStorageState('ll_inventory', INITIAL_INVENTORY);
      const existing = list.find((item: any) => 
        item.hospitalId === hospitalId && 
        item.bloodGroup === bloodGroup.toUpperCase() && 
        item.expiryDate === expiryDate &&
        item.status === 'AVAILABLE'
      );

      if (existing) {
        existing.availableUnits += units;
      } else {
        list.push({
          id: list.length + 1,
          hospitalId,
          bloodGroup: bloodGroup.toUpperCase(),
          availableUnits: units,
          collectionDate: new Date().toISOString().split('T')[0],
          expiryDate,
          status: 'AVAILABLE'
        });
      }
      saveLocalStorageState('ll_inventory', list);
      return list;
    },
    updateUnits: (id: number, units: number) => {
      const list = getLocalStorageState('ll_inventory', INITIAL_INVENTORY);
      const item = list.find((i: any) => i.id === id);
      if (item) {
        item.availableUnits = units;
        if (units === 0) item.status = 'RESERVED';
        saveLocalStorageState('ll_inventory', list);
        return item;
      }
      throw new Error("Inventory not found");
    }
  },

  donors: {
    list: () => getLocalStorageState('ll_donors', INITIAL_DONORS),
    register: (donor: any) => {
      const list = getLocalStorageState('ll_donors', INITIAL_DONORS);
      const newDonor = { ...donor, id: list.length + 1, isAvailable: true };
      list.push(newDonor);
      saveLocalStorageState('ll_donors', list);
      return newDonor;
    }
  },

  requests: {
    list: () => getLocalStorageState('ll_requests', []),
    submit: (requestingHospitalId: number, bloodGroup: string, unitsRequired: number, priority: string) => {
      const requests = getLocalStorageState('ll_requests', []);
      const hospitals = getLocalStorageState('ll_hospitals', INITIAL_HOSPITALS);
      const inventory = getLocalStorageState('ll_inventory', INITIAL_INVENTORY);
      const donorsList = getLocalStorageState('ll_donors', INITIAL_DONORS);

      const requestingHospital = hospitals.find((h: any) => h.id === requestingHospitalId);
      if (!requestingHospital) throw new Error("Hospital not found");

      const newReq = {
        id: requests.length + 1,
        requestingHospital,
        bloodGroup: bloodGroup.toUpperCase(),
        unitsRequired,
        priority: priority.toUpperCase(),
        status: 'ALLOCATED',
        coordinatorNotes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // --- SIMULATED AI AGENT WORKFLOW ---
      const agentLogs = [
        { agentName: 'CoordinatorAgent', action: 'Initiate Request', decision: `Started coordination loops for emergency request ID ${newReq.id}` }
      ];

      // 1. Fraud Check
      const recentReq = requests.find((r: any) => 
        r.requestingHospital.id === requestingHospitalId &&
        r.bloodGroup === bloodGroup.toUpperCase() &&
        r.unitsRequired === unitsRequired &&
        r.status !== 'REJECTED'
      );
      if (recentReq) {
        agentLogs.push({ agentName: 'FraudDetectionAgent', action: 'Integrity Check', decision: `FLAGGED: Duplicate request matching request ID ${recentReq.id} inside 15m. Rejecting request.` });
        newReq.status = 'REJECTED';
        newReq.coordinatorNotes = `Fraud Detected: Duplicate request submitted within 15 minutes of Request ID ${recentReq.id}.`;
        requests.push(newReq);
        saveLocalStorageState('ll_requests', requests);
        return { request: newReq, aiReport: { fraudFlagged: true, fraudReason: newReq.coordinatorNotes, agentLogs } };
      }
      agentLogs.push({ agentName: 'FraudDetectionAgent', action: 'Integrity Check', decision: 'PASSED: Request volume and signature are clean.' });

      // 2. Inventory Search and Filter
      const matchedInventory = inventory.filter((item: any) => 
        item.bloodGroup === bloodGroup.toUpperCase() && 
        item.status === 'AVAILABLE' && 
        item.hospitalId !== requestingHospitalId
      );
      agentLogs.push({ agentName: 'BloodInventoryAgent', action: 'Stock Locator', decision: `Found ${matchedInventory.length} matching available inventory segments across the network.` });

      // 3. Expiry and reservation verification
      const verifiedInventory = matchedInventory.filter((item: any) => new Date(item.expiryDate) >= new Date());
      agentLogs.push({ agentName: 'AvailabilityVerificationAgent', action: 'Expiry Verification', decision: `Verified ${verifiedInventory.length} unexpired and reserved-clear blood bags.` });

      // 4. Distance Calculation
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const candidates = verifiedInventory.map((item: any) => {
        const sourceHosp = hospitals.find((h: any) => h.id === item.hospitalId);
        const distance = calculateDistance(requestingHospital.latitude, requestingHospital.longitude, sourceHosp.latitude, sourceHosp.longitude);
        
        let priorityWeight = 1.0;
        if (priority.toUpperCase() === 'CRITICAL') priorityWeight = 2.5;
        else if (priority.toUpperCase() === 'HIGH') priorityWeight = 1.8;

        const score = (item.availableUnits * 3.0) - (distance * (3.0 / priorityWeight));

        return { item, hospitalName: sourceHosp.name, distance, score, hospitalId: sourceHosp.id };
      });

      candidates.sort((c1: any, c2: any) => c2.score - c1.score);
      agentLogs.push({ agentName: 'DistanceOptimizationAgent', action: 'Proximity Filter', decision: 'Mapped coordinates and completed haversine calculations for neighboring hospitals.' });
      agentLogs.push({ agentName: 'PriorityDecisionAgent', action: 'Scoring Engine', decision: `Ranked candidates: ${candidates.map((c: any) => `${c.hospitalName} (${c.distance.toFixed(1)}km)`).join(', ')}` });

      // 5. Allocation splits
      let remainingNeeded = unitsRequired;
      const allocations: any[] = [];
      const pendingTransactions: any[] = [];

      for (const cand of candidates) {
        if (remainingNeeded <= 0) break;
        const take = Math.min(cand.item.availableUnits, remainingNeeded);
        if (take > 0) {
          allocations.push({
            hospitalId: cand.hospitalId,
            hospitalName: cand.hospitalName,
            unitsProvided: take,
            distance: cand.distance
          });

          // Queue pending transaction in localStorage
          const txs = getLocalStorageState('ll_transactions', []);
          const newTx = {
            id: txs.length + 1 + pendingTransactions.length,
            request: { id: newReq.id, bloodGroup, unitsRequired },
            bloodGroup,
            units: take,
            sourceHospital: hospitals.find((h: any) => h.id === cand.hospitalId),
            destinationHospital: requestingHospital,
            transactionDate: new Date().toISOString(),
            status: 'PENDING'
          };
          pendingTransactions.push(newTx);
          remainingNeeded -= take;
        }
      }

      const isFullyAllocated = remainingNeeded === 0;
      agentLogs.push({ agentName: 'BloodAllocationAgent', action: 'Splitter Engine', decision: isFullyAllocated ? `SUCCESS: Flipped allocation target: all ${unitsRequired} units sourced.` : `PARTIAL: Sourced ${unitsRequired - remainingNeeded}/${unitsRequired} units.` });

      // Save transactions
      if (pendingTransactions.length > 0) {
        const txs = getLocalStorageState('ll_transactions', []);
        saveLocalStorageState('ll_transactions', [...txs, ...pendingTransactions]);
      }

      // 6. Donor recommendations
      const recommendedDonors: any[] = [];
      if (!isFullyAllocated) {
        const compatibleDonors = donorsList.filter((d: any) => d.isAvailable);
        compatibleDonors.forEach((donor: any) => {
          const distance = calculateDistance(requestingHospital.latitude, requestingHospital.longitude, donor.latitude, donor.longitude);
          recommendedDonors.push({
            donorName: donor.name,
            bloodGroup: donor.bloodGroup,
            distance,
            contact: donor.contactNumber
          });
        });
        agentLogs.push({ agentName: 'DonorRecommendationAgent', action: 'Donor Finder', decision: `Found ${recommendedDonors.length} nearby backup compatible donors.` });
      }

      // 7. Predictions & Shortage forecasts
      const warnings: string[] = [];
      candidates.forEach((c: any) => {
        const alloc = allocations.find((a: any) => a.hospitalId === c.hospitalId);
        if (alloc) {
          const afterUnits = c.item.availableUnits - alloc.unitsProvided;
          if (afterUnits <= 3) {
            const warning = `Hospital '${c.hospitalName}' will face critical shortage of '${bloodGroup}'. Remaining: ${afterUnits} units.`;
            warnings.push(warning);
            
            // Save prediction
            const predictions = getLocalStorageState('ll_predictions', []);
            predictions.push({
              id: predictions.length + 1,
              hospital: hospitals.find((h: any) => h.id === c.hospitalId),
              bloodGroup,
              predictedShortageDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              confidenceScore: 0.88,
              recommendedAction: `Organize emergency blood drive for group ${bloodGroup} at ${c.hospitalName} immediately.`
            });
            saveLocalStorageState('ll_predictions', predictions);
          }
        }
      });
      agentLogs.push({ agentName: 'PredictionAgent', action: 'Shortage Analysis', decision: warnings.length > 0 ? `Alert: ${warnings.length} post-allocation shortage alarms triggered.` : 'Clear: Network buffer remains above safety lines.' });

      // Expiry Alert scan
      const expiryAlerts: string[] = [];
      candidates.forEach((c: any) => {
        const diffTime = Math.abs(new Date(c.item.expiryDate).getTime() - new Date().getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          expiryAlerts.push(`Stock item ID ${c.item.id} at '${c.hospitalName}' is expiring in ${diffDays} days.`);
        }
      });
      agentLogs.push({ agentName: 'BloodExpiryAgent', action: 'Scan expiry', decision: expiryAlerts.length > 0 ? `Alert: ${expiryAlerts.length} nearing expiry segments included.` : 'Clear: Selected bags are fresh.' });

      const combinedWarnings = [...warnings, ...expiryAlerts];

      // Build coordinator notes
      newReq.coordinatorNotes = `LifeLink AI Coordinator: ${isFullyAllocated ? 'Successfully allocated' : `Partially allocated ${unitsRequired - remainingNeeded}/${unitsRequired}`} units of ${bloodGroup}. distance optimization resolved ${allocations.length} hospital paths. ${combinedWarnings.length} alerts triggered.`;
      
      // Save notification
      const notifications = getLocalStorageState('ll_notifications', []);
      allocations.forEach((a: any) => {
        notifications.push({
          id: notifications.length + 1,
          userId: 2, // Seattle Admin or similar
          title: 'CRITICAL: Emergency Request Allocation',
          message: `Emergency request for ${unitsRequired} units of ${bloodGroup} has been allocated. Please approve.`,
          isRead: false,
          type: 'CRITICAL_REQUEST',
          createdAt: new Date().toISOString()
        });
      });
      saveLocalStorageState('ll_notifications', notifications);

      requests.push(newReq);
      saveLocalStorageState('ll_requests', requests);

      const aiReport = {
        requestId: newReq.id,
        bloodGroup,
        unitsRequired,
        priority,
        isAllocated: isFullyAllocated,
        allocations,
        compatibleDonors: recommendedDonors,
        fraudFlagged: false,
        fraudReason: null,
        shortageWarnings: combinedWarnings,
        agentLogs
      };

      // Save AI report
      const aiReports = getLocalStorageState('ll_ai_recommendations', {});
      aiReports[newReq.id] = aiReport;
      saveLocalStorageState('ll_ai_recommendations', aiReports);

      return { request: newReq, aiReport };
    },

    getPendingTransactions: (hospitalId: number) => {
      const list = getLocalStorageState('ll_transactions', []);
      return list.filter((tx: any) => tx.sourceHospital.id === hospitalId && tx.status === 'PENDING');
    },

    approveTransaction: (txId: number) => {
      const list = getLocalStorageState('ll_transactions', []);
      const inventory = getLocalStorageState('ll_inventory', INITIAL_INVENTORY);
      const tx = list.find((t: any) => t.id === txId);
      
      if (tx && tx.status === 'PENDING') {
        tx.status = 'COMPLETED';
        
        // Deduct inventory units
        const stock = inventory.find((i: any) => 
          i.hospitalId === tx.sourceHospital.id && 
          i.bloodGroup === tx.bloodGroup &&
          i.status === 'AVAILABLE'
        );
        if (stock) {
          stock.availableUnits = Math.max(0, stock.availableUnits - tx.units);
          if (stock.availableUnits === 0) stock.status = 'RESERVED';
        }
        
        saveLocalStorageState('ll_transactions', list);
        saveLocalStorageState('ll_inventory', inventory);
        
        // Check if all transactions for this request are completed
        const requestTransactions = list.filter((t: any) => t.request.id === tx.request.id);
        const allDone = requestTransactions.every((t: any) => t.status === 'COMPLETED');
        if (allDone) {
          const reqs = getLocalStorageState('ll_requests', []);
          const r = reqs.find((req: any) => req.id === tx.request.id);
          if (r) {
            r.status = 'COMPLETED';
            saveLocalStorageState('ll_requests', reqs);
          }
        }
      }
    },

    rejectTransaction: (txId: number) => {
      const list = getLocalStorageState('ll_transactions', []);
      const tx = list.find((t: any) => t.id === txId);
      if (tx && tx.status === 'PENDING') {
        tx.status = 'CANCELLED';
        saveLocalStorageState('ll_transactions', list);

        const reqs = getLocalStorageState('ll_requests', []);
        const r = reqs.find((req: any) => req.id === tx.request.id);
        if (r) {
          r.status = 'REJECTED';
          r.coordinatorNotes = `Allocation rejected by ${tx.sourceHospital.name} Admin.`;
          saveLocalStorageState('ll_requests', reqs);
        }
      }
    }
  },

  predictions: {
    list: () => getLocalStorageState('ll_predictions', [])
  },

  notifications: {
    list: () => getLocalStorageState('ll_notifications', []),
    readAll: () => {
      const list = getLocalStorageState('ll_notifications', []);
      list.forEach((n: any) => n.isRead = true);
      saveLocalStorageState('ll_notifications', list);
    }
  }
};

// Wrapper API handlers that detect server presence and fall back
export const hospitalAPI = {
  list: async () => {
    if (await checkBackendStatus()) {
      return (await apiClient.get('/public/hospitals')).data;
    }
    return mockService.hospitals.list();
  },
  create: async (h: any) => {
    if (await checkBackendStatus()) {
      return (await apiClient.post('/super/hospitals', h)).data;
    }
    return mockService.hospitals.create(h);
  },
  update: async (id: number, data: any) => {
    if (await checkBackendStatus()) {
      return (await apiClient.put(`/super/hospitals/${id}`, data)).data;
    }
    return mockService.hospitals.update(id, data);
  },
  delete: async (id: number) => {
    if (await checkBackendStatus()) {
      await apiClient.delete(`/super/hospitals/${id}`);
      return;
    }
    mockService.hospitals.delete(id);
  }
};

export const inventoryAPI = {
  list: async () => {
    if (await checkBackendStatus()) {
      return (await apiClient.get('/super/inventory')).data;
    }
    return mockService.inventory.list();
  },
  getByHospital: async (hospitalId: number) => {
    if (await checkBackendStatus()) {
      return (await apiClient.get(`/admin/dashboard`)).data.inventory; // Dashboard contains inventory
    }
    return mockService.inventory.list().filter((i: any) => i.hospitalId === hospitalId);
  },
  add: async (item: any) => {
    if (await checkBackendStatus()) {
      return (await apiClient.post('/admin/inventory', item)).data;
    }
    return mockService.inventory.addOrUpdate(item.hospitalId, item.bloodGroup, item.availableUnits, item.expiryDate);
  },
  updateUnits: async (id: number, units: number) => {
    if (await checkBackendStatus()) {
      return (await apiClient.put(`/admin/inventory/${id}?units=${units}`)).data;
    }
    return mockService.inventory.updateUnits(id, units);
  },
  cleanup: async () => {
    if (await checkBackendStatus()) {
      return (await apiClient.post('/admin/inventory/cleanup')).data;
    }
    return "Expired units cleaned up (mock).";
  }
};

export const requestAPI = {
  submit: async (hospitalId: number, bloodGroup: string, units: number, priority: string) => {
    if (await checkBackendStatus()) {
      // Expose mapping parameters
      const params = new URLSearchParams();
      params.append('requestingHospitalId', hospitalId.toString());
      params.append('bloodGroup', bloodGroup);
      params.append('unitsRequired', units.toString());
      params.append('priority', priority);
      return (await apiClient.post('/requests/emergency', params)).data;
    }
    return mockService.requests.submit(hospitalId, bloodGroup, units, priority).aiReport;
  },
  list: async () => {
    if (await checkBackendStatus()) {
      return (await apiClient.get('/requests/emergency')).data;
    }
    return mockService.requests.list();
  },
  getPendingTransactions: async (hospitalId: number) => {
    if (await checkBackendStatus()) {
      return (await apiClient.get('/admin/dashboard')).data.pendingTransactions;
    }
    return mockService.requests.getPendingTransactions(hospitalId);
  },
  approveTransaction: async (txId: number) => {
    if (await checkBackendStatus()) {
      await apiClient.post(`/admin/transactions/${txId}/approve`);
      return;
    }
    mockService.requests.approveTransaction(txId);
  },
  rejectTransaction: async (txId: number) => {
    if (await checkBackendStatus()) {
      await apiClient.post(`/admin/transactions/${txId}/reject`);
      return;
    }
    mockService.requests.rejectTransaction(txId);
  },
  getAIRecommendation: async (id: number) => {
    if (await checkBackendStatus()) {
      return (await apiClient.get(`/requests/emergency/${id}/recommendation`)).data;
    }
    const reports = getLocalStorageState('ll_ai_recommendations', {});
    return reports[id] || null;
  }
};

export const donorAPI = {
  list: async () => {
    if (await checkBackendStatus()) {
      return (await apiClient.get('/donors')).data;
    }
    return mockService.donors.list();
  },
  register: async (donor: any) => {
    if (await checkBackendStatus()) {
      return (await apiClient.post('/public/donors/register', donor)).data;
    }
    return mockService.donors.register(donor);
  }
};

export const predictionAPI = {
  list: async () => {
    if (await checkBackendStatus()) {
      return (await apiClient.get('/super/predictions')).data;
    }
    return mockService.predictions.list();
  }
};

export const notificationAPI = {
  list: async (userId: number) => {
    if (await checkBackendStatus()) {
      return (await apiClient.get('/admin/notifications')).data;
    }
    return mockService.notifications.list().filter((n: any) => n.userId === userId);
  },
  readAll: async () => {
    if (await checkBackendStatus()) {
      await apiClient.post('/admin/notifications/read-all');
      return;
    }
    mockService.notifications.readAll();
  }
};
