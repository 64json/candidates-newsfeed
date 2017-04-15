import React from 'react';
import moment from 'moment';

class Countdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      countdown: moment('2017-05-09T06:00:00+09:00').diff(moment()),
      dots: 0
    };
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState((prevState) => ({
      countdown: prevState.countdown - 1000
    }));
  }

  render() {
    const { countdown } = this.state;
    const sec = countdown / 1000 | 0;
    const day = sec / 86400 | 0;
    const hour = sec % 86400 / 3600 | 0;
    const minute = sec % 3600 / 60 | 0;
    const second = sec % 60 | 0;
    return <div className="countdown">
      <span>{this.props.progress.total ? '기사를 검색중입니다.' : '조건에 맞는 기사가 없습니다.'}</span>
      <span className="timer">대선까지 {`${day}일 ${hour}시간 ${minute}분 ${second}초`}</span>
    </div>;
  }
}

export default Countdown;