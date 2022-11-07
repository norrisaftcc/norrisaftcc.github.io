# norrisaftcc.github.io
GitHub Pages site

dev blog: [https://norrisaftcc.github.io/dev-blog](https://norrisaftcc.github.io/dev-blog)

pre-installed GitHub Jekyll Themes: [https://pages.github.com/themes/](https://pages.github.com/themes/)


# My Projects
Here are a list of projects I'm working on:
<ul>
	<li><a href="https://github.com/norrisaftcc/linkloadervn">LinkLoaderVN</a> - a simple visual novel prototype.</li>
	<li><a href="https://github.com/norrisaftcc/CTS285_FA22_Sandbox">CTS 285 Sandbox</a> - sample libraries with examples.</li>
</ul>

# My Blog
<ul>
	{% for posts in site.posts %}
	<li>
		<a href="{{ post.url }}">{{ post.title }} </a>
	</li>
	{% endfor %}
</ul>



