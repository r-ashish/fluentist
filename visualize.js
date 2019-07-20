const currentScoreView = document.getElementById("current-score");
const highScoreView = document.getElementById("high-score");
const alertBox = document.getElementById("alert-box");
const THRESHOLD = 80;
const MAX_ALLOWED_CONSECUTIVE_MISSES = 27; // ~ 0.5 sec
const constraints = {audio: true};
const canvas = document.querySelector('.canvas');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const canvasCtx = canvas.getContext("2d");
canvasCtx.fillStyle = 'rgb(256, 256, 256)';
canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
let source;
let audioCtx;
let analyser;
let highScore = 0;
let missedIntervals = 0;
let currentScore;
let startTime;

startListening = () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    if (audioCtx.state !== 'running') {
        audioCtx.resume();
    }
    listen();
}

listen = () => {
    navigator.mediaDevices.getUserMedia (constraints)
    .then(
        function(stream) {
            startTime = Date.now();
            currentScore = 0;
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            visualize();
    })
    .catch( function(err) { console.log('The following gUM error occured: ' + err);});
}

resetVars = () => {
    if (currentScore > highScore) {
        showMsg("New High Score!");
    } else {
        showMsg("Rest & try again!");
    }
    missedIntervals = 0;
    startTime = Date.now();
    setHighScore(Math.max(currentScore, highScore));
    setCurrentScore(0);
    currentScoreView.textContent = `${currentScore}s`;
    highScoreView.textContent = `${highScore}s`;
}

updateCurrentScore = () => {
    setCurrentScore((Date.now() - startTime)/ 1000.0);
    currentScoreView.textContent = `${currentScore}s`;
    showMsg("GG, keep playing!");
}

setCurrentScore = (n) => {
    currentScore = n.toFixed(2);
}

setHighScore = (n) => {
    highScore = n.toFixed(2);
}

showMsg = (msg) => {
    alertBox.textContent = msg;
}


visualize = () => {
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const draw = function() {

        drawVisual = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        const sliceWidth = WIDTH * 1.0 / bufferLength;
        let x = 0;

        let max = 0;

        dataArray.forEach((d) => {
            const v = d / 128.0;
            max = Math.max(max, v * HEIGHT/2);
        });

        if (max <= THRESHOLD) {
            missedIntervals += 1;
            if(missedIntervals > MAX_ALLOWED_CONSECUTIVE_MISSES) {
                // setTimeout(()=> {
                resetVars();
                // }, 1000);
            }
        } else {
            missedIntervals = 0;
            updateCurrentScore();
        }


        for(let i = 0; i < bufferLength; i++) {

            const v = dataArray[i] / 128.0;
            const y = v * HEIGHT/2;

            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();
    };

    draw();
}

resetHighScore = () => {
    setHighScore(0);
}