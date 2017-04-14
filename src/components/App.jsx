import React from 'react';
import async from 'async';
import moment from 'moment';
import '../style.sass';
import candidates from '../data/candidates';
import media from '../data/media';
import { stripTags } from '../utils.js';

moment.locale('ko');

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: candidates.map((v) => true),
      articles: [],
      condition_and: false,
      condition_only: false,
    };

    this.onCandidateSelected = this.onCandidateSelected.bind(this);
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate() {
    document.getElementById('articles').scrollTop = 0;
  }

  fetch() {
    let articles = [];
    async.each(media, (url, cb) => {
      feednami.load(url).then(({ meta, entries }) => {
        let { title: media_title, image: media_image } = meta;
        media_image = media_image && media_image.url;
        articles.push(...entries.map((article) => {
          let { author, link, summary, image, title, pubdate } = article;
          const content = stripTags(summary);
          summary = content.text;
          image = image && image.url || content.image;
          pubdate = moment(pubdate);
          return {
            media_title,
            media_image,
            author,
            link,
            summary,
            image,
            title,
            pubdate
          };
        }));
        articles = articles.sort((a, b) => a.pubdate.isBefore(b.pubdate));
        this.setState({ articles });
        cb(null);
      })
    });
  }

  filter({ title, summary }) {
    const testKeywords = (keywords) => {
      return keywords.some((keyword) => ~title.indexOf(keyword) || ~summary.indexOf(keyword));
    };

    let isOthersIncluded = false;
    if (this.state.condition_only) {
      const bannedKeywordsList = this.state.selected.map((v, i) => {
        return !v && candidates[i].keywords;
      }).filter(v => v);
      isOthersIncluded = bannedKeywordsList.some(testKeywords);
    }

    const keywordsList = this.state.selected.map((v, i) => {
      return v && candidates[i].keywords;
    }).filter(v => v);
    const method = this.state.condition_and ? 'every' : 'some';

    return !isOthersIncluded && keywordsList[method](testKeywords);
  }

  onCandidateSelected({ target }) {
    const { name, checked } = target;
    const i = name.split('_')[1];
    this.toggleCandidate(i, checked);
  }

  toggleCandidate(i, checked) {
    this.setState((prevState) => {
      const selected = [...prevState.selected];
      selected[i] = checked;
      return { selected };
    });
  }

  render() {
    const articles = this.state.articles.filter(this.filter.bind(this));
    const articleCount = articles.length;
    const candidateCount = this.state.selected.filter(v => v).length;
    const and = this.state.condition_and;
    const only = this.state.condition_only;
    let resultMessage = `선택된 ${candidateCount}명`;
    if (candidateCount === 1) {
      resultMessage += '의 후보';
      if (only) {
        resultMessage += '만을';
      } else {
        resultMessage += '를';
      }
      resultMessage += ' 다루는';
    } else {
      resultMessage += and ? '의 후보 모두를 ' : ' 중 한명 이상의 후보를 ';
      if (only && candidateCount < candidates.length) {
        resultMessage += '다루고 이외의 후보는 다루지 않는';
      } else {
        resultMessage += '다루는';
      }
    }
    resultMessage += ` 기사 (${articleCount}건)`;

    return <div className="container">
      <div className="header">
        <div className="bluehouse" />
        <span className="title-tertiary"><span>대한민국</span></span>
        <span className="title-secondary">제19대 대통령 선거</span>
        <span className="title-primary">후보 뉴스피드</span>
      </div>
      <div className="content">
        <div className="side-container">
          <div className="option-container">
            <input type="radio" className="toggle-option" name="cond_and_or" id="cond_and"
                   checked={this.state.condition_and}
                   onChange={({ target }) => this.setState({ condition_and: true })} />
            <label htmlFor="cond_and" className="option">AND</label>
            <input type="radio" className="toggle-option" name="cond_and_or" id="cond_or"
                   checked={!this.state.condition_and}
                   onChange={({ target }) => this.setState({ condition_and: false })} />
            <label htmlFor="cond_or" className="option">OR</label>
            <input type="checkbox" className="toggle-option" name="cond_only" id="cond_only"
                   checked={this.state.condition_only}
                   onChange={({ target }) => this.setState({ condition_only: target.checked })} />
            <label htmlFor="cond_only" className="option">ONLY</label>
          </div>
          <div className="candidate-container">
            {
              candidates.map(({ suffix, name, party }, i) => [
                <input type="checkbox" className="toggle-candidate" id={`toggle_${i}`} name={`candidate_${i}`}
                       onChange={this.onCandidateSelected} checked={this.state.selected[i]} />,
                <label className={`candidate candidate-${suffix}`} htmlFor={`toggle_${i}`}>
                  <div className="picture" />
                  <div className="description">
                    <span className="party">{party}</span>
                    <span className="name">{name}</span>
                  </div>
                </label>
              ])
            }
          </div>
        </div>
        <div className="main-container">
          <div className="bar-container">
            {
              candidates.map(({ suffix, name }, i) =>
                this.state.selected[i] &&
                <div className={`bar bar-${suffix}`} key={i} onClick={() => this.toggleCandidate(i, false)}>
                  {name}
                </div>
              )
            }
          </div>
          <div className="article-container" id="articles">
            <div className="result-message">
              {resultMessage}
            </div>
            {
              articles.map(({ media_title, media_image, author, link, summary, image, title, pubdate }, i) =>
                <a className="article" key={i} href={link} target="_blank">
                  <div className={`picture ${image ? '' : 'picture-default'}`}
                       style={image && { backgroundImage: `url(${image})` }} />
                  <div className="description">
                    <h2 className="title">{title}</h2>
                    <p className="summary" dangerouslySetInnerHTML={{ __html: summary }} />
                    <div className="minor">
                      <span
                        className="author">{media_title == author || !author ? media_title : `${media_title} - ${author}`}</span>
                      <span className="pubdate">{pubdate.calendar()}</span>
                    </div>
                  </div>
                </a>
              )
            }
          </div>
        </div>
      </div>
    </div>;
  }
}

export default App;