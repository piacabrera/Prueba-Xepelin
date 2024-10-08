# Prueba Xepelin

## Parte 1

El link de GSheet es https://docs.google.com/spreadsheets/d/1Fe_s4hD34b9cvNCec1gIVozuOoF5TQ3uNmuerni4H_g

El link del deploy es https://prueba-xepelin.onrender.com

#### Consideraciones:
- No se crea una base de datos para el login básico, solamente está definido un usuario válido en un diccionario (se pueden agregar y hacer un bdd, pero no implmenté un registro ya que era solo login asi que no pensé que fuera necesario)
- El usuario válido es ```{ username: 'admin', password: '123'}```


## Parte 2

La API es la misma, por lo que el .env se mantiene.

El link de GSheet es https://docs.google.com/spreadsheets/d/1JxpYrYFPKVgvCeZfcv511XSE8AwxgnK39lWnHxvhQo4

El código del scraper está en ```utils.js```, el código de la API es el código completo.

###  POST /scrape-by-category-name

Recibe como body la categoría y el webhook:
````
{
    category: 'Xepelin',
    webhook: 'https://hooks.zapier.com/hooks/catch/11217441/bfemddr'
}
````
Retorna 'Scraping completado y respuesta enviada al webhook.' en caso exitoso. 


```
curl -X POST "https://prueba-xepelin.onrender.com/scrape-by-category-name" \
-H "Content-Type: application/json" \
-d '{"category": "casos de éxito", "webhook": "https://hooks.zapier.com/hooks/catch/11217441/bfemddr/"}'
```

### POST /scrape-blog

Recibe como body el webhook:
````
{
    webhook: 'https://hooks.zapier.com/hooks/catch/11217441/bfemddr'
}
````
Retorna 'Scraping completado y respuesta enviada al webhook.' en caso exitoso. 

```
curl -X POST "https://prueba-xepelin.onrender.com/scrape-blog" \
-H "Content-Type: application/json" \
-d '{"category": "casos de éxito", "webhook": "https://hooks.zapier.com/hooks/catch/11217441/bfemddr/"}'
```


#### Consideraciones
- Asumí que la categoría se entrega como se lee en el blog, no como aparece en la ruta. Por ejemplo la categoría 'Casos de éxito' pero tiene como ruta ```https://xepelin.com/blog/empresarios-exitosos```, y se asume que el body del request sería
````
{
    category: 'Casos de éxito',
    webhook: 'https://hooks.zapier.com/hooks/catch/11217441/bfemddr'
}
````
- En la hoja de cálculos, se guarda la información de cada categoría en una pestaña con el nombre de la categoría. La información del blog completo se guarda en una pestaña llamada 'All Articles Of Blog'
- No pude encontrar la fecha de todos los artículos, solo algunos la tenían al aparecer en recomendados, asi que solo esos tienen una fecha.
