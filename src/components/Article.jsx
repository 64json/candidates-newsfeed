import React from 'react';

const Article = ({ media_title, author, link, summary, image, title, pubDate }) => (
  <a className="article" href={link} target="_blank">
    <div className={`picture ${image ? '' : 'picture-default'}`}
         style={image && { backgroundImage: `url(${image})` }} />
    <div className="description">
      <h2 className="title">{title}</h2>
      <p className="summary" dangerouslySetInnerHTML={{ __html: summary }} />
      <div className="minor">
        <span className="author">{media_title == author || !author ? media_title : `${media_title} - ${author}`}</span>
        <span className="pubDate">{pubDate.lang('ko').calendar()}</span>
      </div>
    </div>
  </a>
);

export default Article;