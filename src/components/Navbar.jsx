import React from 'react'
import './Navbar.css'

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          Sistema de Produtos
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <a href="#" className="nav-link active">Home</a>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar