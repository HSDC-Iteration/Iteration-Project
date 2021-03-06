import React, { Component } from 'react';
import Chat from './chat'
import Profile from './profile'
import '../../Style.css'


export default class Canvas extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: 'black',
      thickness: 3,
      pathArray: []
    };
  }

  componentDidMount() {
    const socket = io.connect('http://localhost:3000');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.height = window.innerHeight * 0.8;
    canvas.width = canvas.height * 1.5;

    const fromTop = canvas.getBoundingClientRect().top;
    const fromLeft = canvas.getBoundingClientRect().left;
    let painting = false;

    let imageData;
    function startPosition(e) {
      // save previous state of canvas
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      painting = true;
      draw(e);

      const x = (e.clientX - fromLeft) / canvas.width;
      const y = (e.clientY - fromTop) / canvas.height;

      socket.emit('down', { down: true, x, y });
    }

    const points = [];
    const path = [];
    function finishedPosition() {
      path.push(points);
      console.log(path)
      painting = false;
      ctx.beginPath();
      socket.emit('down', { down: false });
    }

    const draw = (e) => {
      if (!painting) return;
      ctx.lineWidth = this.state.color === 'grey' ? 20 : this.state.thickness;
      ctx.lineCap = 'round';
      ctx.strokeStyle = this.state.color;
      ctx.lineTo(e.clientX - fromLeft, e.clientY - fromTop);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX - fromLeft, e.clientY - fromTop);

      const x = (e.clientX - fromLeft) / canvas.width;
      const y = (e.clientY - fromTop) / canvas.height;

      points.push({ x, y, color: this.state.color, thickness: this.state.thickness })

      socket.emit('mouse', { x, y, color: this.state.color, thickness: this.state.thickness });
    };

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', finishedPosition);
    canvas.addEventListener('mousemove', draw);

    let down = false;

    socket.on('down', (data) => {
      down = data.down;
      if (!data.down) ctx.beginPath();
      else down2(data);
    });

    socket.on('mouseback', down2);
    function down2(data) {
      if (!down) return;
      ctx.lineWidth = data.color === 'grey' ? 20 : data.thickness;
      ctx.lineCap = 'round';
      ctx.strokeStyle = data.color;

      ctx.lineTo(data.x * canvas.width, data.y * canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(data.x * canvas.width, data.y * canvas.height);
    }

    function clearCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const clearButton = document.getElementById('clear');
    console.log(clearButton);
    clearButton.onclick = () => {
      clearCanvas();
      socket.emit('clear');
    };

    const undoButton = document.getElementById('undo');
    undoButton.onclick = () => {
      undo();
    }
    function undo() {
      ctx.putImageData(imageData, 0, 0);
    }
    socket.on('clearBack', clearCanvas);
  }

  changeColor(color) {
    this.setState({ ...this.state, color });
  }

  changeThickness(sign) {
    if (sign === '+' && this.state.thickness <= 20)
      this.setState({ ...this.state, thickness: this.state.thickness + 2 });
    if (sign === '-' && this.state.thickness > 1)
      this.setState({ ...this.state, thickness: this.state.thickness - 2 });
  }

  render() {
    return (
      <div className='canvas-page'>
        <div>
          <canvas id="canvas" />
          <div>
            <button
              id="black"
              className="button-div"
              onClick={() => {
                this.changeColor('black');
              }}
            >black</button>
            <button
              id="blue"
              className="button-div"
              onClick={() => {
                this.changeColor('blue');
              }}
            >blue</button>
            <button
              id="red"
              className="button-div"
              onClick={() => {
                this.changeColor('red');
              }}
            >red</button>
            <button
              id="white"
              className="button-div"
              onClick={() => {
                this.changeColor('grey');
              }}
            >eraser</button>
            <button
              className="button-div"
              onClick={() => {
                this.changeThickness('+');
              }}
            >+</button>
            <button
              className="button-div"
              onClick={() => {
                this.changeThickness('-');
              }}
            >-</button>
            <button id="clear" className="button-div">clear</button>
            <button id="undo" className="button-div">undo</button>
          </div>
        </div>
        <div >
          <Chat className='chat-box' />
        </div>
      </div>
    );
  }
}
