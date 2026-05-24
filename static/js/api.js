const api = {
    async fetchAssets() {
        const response = await fetch('/api/assets');
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
    },

    async predictTransitions(schedule, startHour = 0) {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule, start_hour: startHour })
        });
        return response.json();
    },

    async optimizeSchedule(schedule, weights, strategy = 'sa', startHour = 0) {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule, weights, strategy, start_hour: startHour })
        });
        return response.json();
    },
    
    async parseIntent(text) {
        const response = await fetch('/api/parse-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        return response.json();
    },

    async selfHeal(schedule, datetime, region = 'US') {
        const response = await fetch('/api/self-heal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule, datetime, region })
        });
        return response.json();
    },

    async simulate(scheduleBefore, scheduleAfter, startHour = 0) {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule_before: scheduleBefore, schedule_after: scheduleAfter, start_hour: startHour })
        });
        return response.json();
    }
};
