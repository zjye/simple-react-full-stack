import React, { Component } from 'react';
import './app.css';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { username: null };
  }

  componentDidMount() {
    fetch('/api/getUsername')
      .then(res => res.json())
      .then(user => this.setState({ username: user.username }));
  }

  handleErrorClick() {
    try {
      this.doSomething();
    } catch (error) {
      console.log(error);
    }
  }

  doSomething() {
    throw new Error('something wrong');
  }

  handleMeClick() {
    fetch('/api/getUsername')
      .then(res => res.json())
      .then(user => this.setState({ username: user.username }));
  }

  render() {
    return (
      <div>
        {this.state.username ? (
          <h1>Hello {this.state.username}</h1>
        ) : (
          <h1>Loading.. please wait!</h1>
        )}
        <button onClick={this.handleErrorClick}>error</button>
        <button onClick={this.handleMeClick}>me</button>
      </div>
    );
  }
}
