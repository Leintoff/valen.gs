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
| <kbd>H</kbd> | esconde o muestra los botones |


## como funciona

la idea central es que la animación es una función pura del tiempo :3

no hay estado que se va mutando frame a frame. hay una variable global `T` (segundos desde `t0`) y cada elemento calcula su progreso con una sola función
cada flor deriva tres valores de `T` en `budState()`:

| valor | para que sirve |
| :--- | :--- |
| `grow` | tamaño-estado de flor |
| `blush` | color: verde a rosado |
| `open` | apertura de los petalos |


una flor son **6 piezas con la misma forma** (`bezierCurveTo`), rotados `k * 60° * open`. abrir la flor es, literalmente, rotarlos hacia afuera. el color se interpola en RGB con `mix()`: verde, rosa polvo y color final.

### el renderer ascii
```
 canvas offscreen          getImageData            canvas visible
 (cols x rows px)    ->    brillo por pixel   ->   fillText(RAMP[i])
 1 pixel = 1 celda         max(r, g, b)            + glow con blur
```
' .:-=+*cxoaX#%&@'`: `de poca luz (`.`) a mucha (`@`)
un punto oscuro se vuelve un `.` y uno clarito se vuelve un `@`. 

## parametros de la url

 
| param | valores | default | que hace |
| :--- | :--- | :---: | :--- |
| `to` | texto (max 22) | | destinatario de la tarjeta |
| `msg` | texto (max 22) | | mensaje de la tarjeta |
| `from` | texto (max 22) | | firma de la tarjeta |
| `bug` | `butterfly` `bee` `ladybug` `none` | `butterfly` | bichito visitante |
| `wing` | nombre o hex de 6 dígitos | `blue` | color de alas |
| `ribbon` | `off` `0` `no` `false` | on | oculta el moño |
| `p` | `0` `1` `2` | `0` | paleta: rosa, blanca, mixta |
| `t` | segundos | `0` | arranca adentro de la animación |
| `ui` | `off` `0` `no` `false` | on | oculta los botones |
 
ejemplo para mandar con mensaje:
 
```
https://leintoff.github.io/valen.gs/?to=Mati&msg=feliz%20cumple&from=Valen&ui=off
```
 

<br>

<br> <p align="center"> hecho por <a href="https://github.com/Leintoff">Valen G. Spilere</a> ♡ </p>
