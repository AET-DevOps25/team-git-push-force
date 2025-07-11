package de.tum.aet.devops25;

import de.tum.aet.devops25.api.generated.model.GetGatewayHealth200Response;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class GatewayHealthControllerTest {

    @Autowired
    private GatewayHealthController gatewayHealthController;

    @Test
    void contextLoads() {
        // This test verifies that the Spring Boot application context can be loaded successfully
    }

    @Test
    void testGetGatewayHealth() {
        // Test the getGatewayHealth method of the GatewayHealthController
        ResponseEntity<GetGatewayHealth200Response> response = gatewayHealthController.getGatewayHealth();
        
        // Verify that the response is not null
        assertNotNull(response);
        assertNotNull(response.getBody());
        
        // Verify that the status is "UP"
        assertEquals("UP", response.getBody().getStatus());
        
        // Verify that the timestamp is not null
        assertNotNull(response.getBody().getTimestamp());
    }
}