let timeRemaining;
let timerInterval;

self.onmessage = function(e) {
    if (e.data.command === 'start') {
        if (e.data.duration !== undefined) {
            timeRemaining = e.data.duration;
        }
        timerInterval = setInterval(() => {
            timeRemaining -= 1;
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                self.postMessage({ command: 'end' });
            } else {
                self.postMessage({ command: 'tick', time: timeRemaining });
            }
        }, 1000);
    } else if (e.data.command === 'stop') {
        clearInterval(timerInterval);
    } else if (e.data.command === 'reset') {
        clearInterval(timerInterval);
        timeRemaining = e.data.duration;
        self.postMessage({ command: 'tick', time: timeRemaining });
    }
};