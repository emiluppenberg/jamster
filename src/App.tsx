import './App.css'
import Figure from './components/Figure'
import { JamsterProvider } from './Context'

const AppContainer = () => {
  return (
    <JamsterProvider>
      <AppContent />
    </JamsterProvider>
  )
}

const AppContent = () => {
  return (
    <div className='app'>
      <Figure />
    </div>
  )
}

export default AppContainer;
