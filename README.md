# norrisaftcc.github.io
GitHub Pages site

dev blog: [https://norrisaftcc.github.io/dev-blog](https://norrisaftcc.github.io/dev-blog)

pre-installed GitHub Jekyll Themes: [https://pages.github.com/themes/](https://pages.github.com/themes/)

Posts:
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
