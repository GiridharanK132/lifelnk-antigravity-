package com.lifelink.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import java.lang.reflect.Method;

@Component
public class H2ConsoleConfig {
    private static final Logger logger = LoggerFactory.getLogger(H2ConsoleConfig.class);
    private Object h2ServerInstance;

    @EventListener(ContextRefreshedEvent.class)
    public void startH2Console() {
        try {
            logger.info("Loading H2 Server class dynamically via reflection...");
            Class<?> serverClass = Class.forName("org.h2.tools.Server");
            
            // Resolve the static factory method: Server.createWebServer(String... args)
            Method createWebServerMethod = serverClass.getMethod("createWebServer", String[].class);
            
            // Define H2 console execution parameters
            String[] args = new String[]{"-web", "-webAllowOthers", "-webPort", "8082"};
            
            // Instantiate the H2 Server
            h2ServerInstance = createWebServerMethod.invoke(null, (Object) args);
            
            // Start the server
            Method startMethod = serverClass.getMethod("start");
            startMethod.invoke(h2ServerInstance);
            
            logger.info("=================================================================");
            logger.info("MANUAL H2 DATABASE CONSOLE RUNNING ON: http://127.0.0.1:8082");
            logger.info("=================================================================");
        } catch (Exception e) {
            logger.warn("Could not start H2 database web console programmatically: {}", e.getMessage());
        }
    }
}
