<h1 align="center">Valen GS.</h1>

<p align="center">
  <i>hmph!</i>
</p>

<p align="center">
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=F4A6C0&center=true&vCenter=true&width=600&lines=mariposas+abejas+y+mariquitas;presiona+una+tecla+y+mira+qu%C3%A9+pasa" alt="Typing animation" /></p>

<br>

## Controles

Se puede insertar &to=<user>&from=<user> y &msg= para un tag personalizado c: 
| Tecla | Qué hace |
| :---: | :--- |
| <kbd>W</kbd> | cambia el color de la mariposa |
| <kbd>V</kbd> | alterna entre abeja y mariquita |
| <kbd>B</kbd> | saca el ribbon |
| <kbd>C</kbd> | cambia el color |

la idea central es que la animación es una función pura del tiempo :3
cada flor tiene 3 valores derivados de T en budState(): grow, blush y open. cada flor son 6 piezas que son la misma forma con bezierCurveTo, rotados k*60*open grados, entonces abrir la flor es literalmente rotarlos hacia afuera. el color pasa de verde a rosado a color final con mix(), que interpola en RGB.

<br>

<p align="center">
  <sub>una flor a la vez</sub>
</p>
