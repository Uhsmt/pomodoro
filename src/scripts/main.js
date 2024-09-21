document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const startButton = document.getElementById('start-btn');
    const stopButton = document.getElementById('stop-btn');
    const resetButton = document.getElementById('reset-btn');
    const alarmSound = document.getElementById('alarm');
    const waveSound = document.getElementById('waves');
    const workDurationMinutesInput = document.getElementById('work-duration-minutes');
    const breakDurationMinutesInput = document.getElementById('break-duration-minutes');
    const longBreakDurationMinutesInput = document.getElementById('long-break-duration-minutes');
    const clickSound = document.getElementById('click-sound');

    // progress display
    var canvas = document.getElementById('timerChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    let ctx = document.getElementById('timerChart').getContext('2d');
    let timerChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Elapsed', 'Remaining'],
            datasets: [{
                data: [0, 1], // 初期値（経過時間0、残り時間1）
                backgroundColor: ['#00d9ffb0', '#1a1a1a'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,  // レスポンシブ設定を無効に
            maintainAspectRatio: false,  // アスペクト比の維持を無効に
            cutout: '50%',
            plugins: {
                legend: {
                    display: false  // ラベルを非表示に
                }
            }
        }
    });
    const worker = new Worker('src/scripts/timerWorker.js');
    let isWorkTime = true;
    let isRunning = false;
    let workCycle = 1;
    let remainingTime = workDurationMinutesInput.value * 60;

    // Initialize the timer display with default values
    updateTimer(workDurationMinutesInput.value * 60);
    
    worker.onmessage = function(e) {
        if (e.data.command === 'tick') {
            remainingTime = e.data.remainingTime; // 残り時間を更新
            if ( e.data.time){
                updateTimer(e.data.time);
            }
        } else if (e.data.command === 'end') {
            alarmSound.play();
            isWorkTime = !isWorkTime;
            if (isWorkTime) {
                workCycle++;
                document.getElementById('work-cycle').textContent = `Work Cycle: ${workCycle}`;
                statusElement.textContent = 'Status: Work Time';
                worker.postMessage({ command: 'start', duration: parseInt(workDurationMinutesInput.value) * 60 });
                fadeOutAudio(waveSound);
            } else {
                let breakDuration = (workCycle % 4 === 0) 
                    ? longBreakDurationMinutesInput.value * 60 
                    : breakDurationMinutesInput.value * 60;
    
                statusElement.textContent = 'Status: Break Time';
                waveSound.volume = 1;
                waveSound.play();
                worker.postMessage({ command: 'start', duration: breakDuration });
            }
        }
    };
    worker.onerror = function(error) {
        console.error('Worker error:', error);
    };
    

    startButton.addEventListener('click', () => {
        clickSound.play();  // クリック音を再生
        if (!isRunning) {
            isRunning = true;
            worker.postMessage({
                command: 'start',
                duration: remainingTime
            });
            statusElement.textContent = isWorkTime ? 'Status: Work Time' : 'Status: Break Time';
            if (!isWorkTime) {
                waveSound.volume = 1;
                waveSound.play();
            }
            startButton.setAttribute('disabled', 'disabled');
            stopButton.removeAttribute('disabled');
        }
    });
    
    stopButton.addEventListener('click', () => {
        clickSound.play();  // クリック音を再生
        if (isRunning) {
            worker.postMessage({ command: 'stop' });
            isRunning = false;
            statusElement.textContent = 'Status: Stopped';
            fadeOutAudio(waveSound);
            stopButton.setAttribute('disabled', 'disabled');
            startButton.removeAttribute('disabled');
        }
    });
    
    resetButton.addEventListener('click', () => {
        clickSound.play();  // クリック音を再生
        worker.postMessage({ command: 'reset', duration: workDurationMinutesInput.value * 60 });
        isRunning = false;
        isWorkTime = true;
        workCycle = 1;
        document.getElementById('work-cycle').textContent = `Work Cycle: ${workCycle}`;
        statusElement.textContent = 'Status: Work Time';
        fadeOutAudio(waveSound);
        stopButton.setAttribute('disabled', 'disabled');
        startButton.removeAttribute('disabled');
    });


    function updateTimer(seconds) {
        const timerElement = document.getElementById('timer');
        let minutes = Math.floor(seconds / 60);
        let remainingSeconds = seconds % 60;
        timerElement.textContent = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    
        let totalDuration = isWorkTime ? parseInt(workDurationMinutesInput.value) * 60 : parseInt(breakDurationMinutesInput.value) * 60;
        let elapsed = totalDuration - seconds;
        let remaining = seconds;
        updateChart(elapsed, remaining);
    }
        
    function updateChart(elapsed, remaining) {
        timerChart.data.datasets[0].data = [elapsed, remaining];
        timerChart.update();
    }

    function fadeOutAudio(audio) {
        let fadeOutInterval = setInterval(() => {
            if (audio.volume > 0.05) {
                audio.volume -= 0.05;
            } else {
                clearInterval(fadeOutInterval);
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 1; // 音量を元に戻す
            }
        }, 100);
    }
});

