import countries from "./data/countries"
import cards from "./data/cards";

const App = () => {
  return (
    <section>
      {countries.map(c => (
        <div key={c.abrv} className="" style={{ backgroundColor: c.colors[0] }}>
          <h1>{c.name}</h1>
          {cards.map(crd => (
            <div style={{ border: crd.type === 'hollographic' ? '4px solid #9B9B9B' : `4px solid ${c.colors[0]}` }}>
              <h3>
                {crd.number}
              </h3>
              <h5>{crd.content}</h5>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

export default App;
